import mongoose from "mongoose";
import { Collections, DBCollection } from "../handler/utils.ts";
import fs from "fs/promises";
import { DateTime } from "luxon";

const uri = process.env.MONGO_URI;
await mongoose.connect(uri ? uri : "", {
  dbName: DBCollection.STOCKON,
});

const categoryItemSchema = new mongoose.Schema(
  {
    location: { type: String, required: true, index: true },
    area: { type: String, required: true },
    category: { type: String, required: true },
    item_id: { type: String, default: "" },
    name: { type: String, default: "" },
    unit_sz: { type: String, default: "" },
  },
  { timestamps: true }
);

categoryItemSchema.index({ location: 1, area: 1, category: 1 });

export const CATEGORY_ITEMS = mongoose.model(
  Collections.CATEGORY_ITEMS,
  categoryItemSchema
);

const categoriesMetaSchema = new mongoose.Schema(
  {
    location: { type: String, required: true, unique: true },
    lastSynced: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CATEGORIES_META = mongoose.model(
  Collections.CATEGORIES_META,
  categoriesMetaSchema
);

const sourceItemSchema = new mongoose.Schema({
  Item_ID: String,
  Name: String,
  Unit_Size: String,
  Order_Quantity: String,
  Category: String,
  Area: String,
});

const StacksModel = mongoose.model("Stacks", sourceItemSchema, "Stacks");
const BiscottiModel = mongoose.model("Biscotti", sourceItemSchema, "Biscotti");
const ProvisionsModel = mongoose.model("Provisions", sourceItemSchema, "Provisions");
const OutpostModel = mongoose.model("Outpost", sourceItemSchema, "Outpost");

const CATEGORIES_FILE = "categories_schema.json";
const BACKUPS_DIR = "categories_backups";

async function ensureBackupsDir() {
  try {
    await fs.mkdir(BACKUPS_DIR, { recursive: true });
  } catch (e) {
    console.error("Error creating backups directory:", e);
  }
}

async function createBackup() {
  try {
    await ensureBackupsDir();
    const timestamp = DateTime.now()
      .setZone("America/New_York")
      .toFormat("yyyy-MM-dd_HH-mm-ss");
    const backupPath = `${BACKUPS_DIR}/categories_${timestamp}.json`;

    const currentContent = await Bun.file(CATEGORIES_FILE).text();
    await fs.writeFile(backupPath, currentContent);
    console.log(`Backup created: ${backupPath}`);
  } catch (e) {
    console.error("Error creating backup:", e);
  }
}

function transformToCategories(items: any[]): any {
  const areas: Map<string, any> = new Map();

  for (const item of items) {
    const areaName = item.Area;
    const category = item.Category;

    if (!areas.has(areaName)) {
      areas.set(areaName, { name: areaName, info: {} });
    }

    const area = areas.get(areaName);
    if (!area.info[category]) {
      area.info[category] = [];
    }

    area.info[category].push({
      item_id: item.Item_ID,
      name: item.Name,
      unit_sz: item.Unit_Size,
    });
  }

  return { areas: Array.from(areas.values()) };
}

async function scrapeFromMongo(): Promise<any> {
  try {
    const [stacks, biscotti, provisions, outpost] = await Promise.all([
      StacksModel.find({}).lean(),
      BiscottiModel.find({}).lean(),
      ProvisionsModel.find({}).lean(),
      OutpostModel.find({}).lean(),
    ]);

    return {
      Stacks: stacks,
      Biscotti: biscotti,
      Provisions: provisions,
      Outpost: outpost,
    };
  } catch (e) {
    console.error("Error scraping from MongoDB:", e);
    return null;
  }
}

function deepEqual(obj1: any, obj2: any): boolean {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export async function syncFromMongoToCategories() {
  try {
    const scrapedData = await scrapeFromMongo();
    if (!scrapedData) {
      console.error("Failed to scrape data from MongoDB");
      return;
    }

    const hasScrapedData = Object.values(scrapedData).some(
      (items: any) => items && items.length > 0
    );
    
    if (!hasScrapedData) {
      // No data in source collections - check if DB was modified and sync to file
      await syncDbToFile();
      return;
    }

    // Source collections have data - sync from them to DB
    const currentItems = await CATEGORY_ITEMS.find({}).lean();
    const currentData: any = {};
    for (const item of currentItems) {
      if (!currentData[item.location]) currentData[item.location] = [];
      currentData[item.location].push(item);
    }

    if (deepEqual(scrapedData, currentData)) {
      return;
    }

    console.log("Changes detected in source collections, creating backup...");
    await createBackup();

    for (const [location, items] of Object.entries(scrapedData)) {
      await CATEGORY_ITEMS.deleteMany({ location });
      
      const itemsToInsert = (items as any[]).map(item => ({
        location,
        area: item.Area,
        category: item.Category,
        item_id: item.Item_ID,
        name: item.Name,
        unit_sz: item.Unit_Size,
      }));

      if (itemsToInsert.length > 0) {
        await CATEGORY_ITEMS.insertMany(itemsToInsert);
      }

      await CATEGORIES_META.findOneAndUpdate(
        { location },
        { location, lastSynced: new Date() },
        { upsert: true, new: true }
      );
    }

    await syncDbToFile();
    console.log("Categories synced from source collections");
  } catch (e) {
    console.error("Error syncing from MongoDB:", e);
  }
}

async function syncFileToDb() {
  try {
    const fileContent = await Bun.file(CATEGORIES_FILE).text();
    const data = JSON.parse(fileContent);

    for (const [location, config] of Object.entries(data)) {
      const areas = (config as any).areas || [];
      
      await CATEGORY_ITEMS.deleteMany({ location });
      
      const itemsToInsert: any[] = [];
      for (const area of areas) {
        for (const [category, items] of Object.entries(area.info)) {
          for (const item of items as any[]) {
            itemsToInsert.push({
              location,
              area: area.name,
              category,
              item_id: item.item_id,
              name: item.name,
              unit_sz: item.unit_sz,
            });
          }
        }
      }

      if (itemsToInsert.length > 0) {
        await CATEGORY_ITEMS.insertMany(itemsToInsert);
      }

      await CATEGORIES_META.findOneAndUpdate(
        { location },
        { location, lastSynced: new Date() },
        { upsert: true, new: true }
      );
    }
    console.log("Categories synced from file to DB");
  } catch (e) {
    console.error("Error syncing file to DB:", e);
  }
}

async function syncDbToFile() {
  try {
    const items = await CATEGORY_ITEMS.find({}).lean();
    const data: any = {};

    for (const item of items) {
      if (!data[item.location]) {
        data[item.location] = { areas: [] };
      }

      let area = data[item.location].areas.find((a: any) => a.name === item.area);
      if (!area) {
        area = { name: item.area, info: {} };
        data[item.location].areas.push(area);
      }

      if (!area.info[item.category]) {
        area.info[item.category] = [];
      }

      area.info[item.category].push({
        item_id: item.item_id,
        name: item.name,
        unit_sz: item.unit_sz,
      });
    }

    const newContent = JSON.stringify(data, null, 2);
    const currentContent = await Bun.file(CATEGORIES_FILE).text().catch(() => "");
    
    if (newContent !== currentContent) {
      await createBackup();
      await fs.writeFile(CATEGORIES_FILE, newContent);
      console.log("Categories synced from DB to file");
    }
  } catch (e) {
    console.error("Error syncing DB to file:", e);
  }
}

export async function getCategories(): Promise<any> {
  const items = await CATEGORY_ITEMS.find({}).lean();
  const data: any = {};

  for (const item of items) {
    if (!data[item.location]) {
      data[item.location] = { areas: [] };
    }

    let area = data[item.location].areas.find((a: any) => a.name === item.area);
    if (!area) {
      area = { name: item.area, info: {} };
      data[item.location].areas.push(area);
    }

    if (!area.info[item.category]) {
      area.info[item.category] = [];
    }

    area.info[item.category].push({
      item_id: item.item_id,
      name: item.name,
      unit_sz: item.unit_sz,
    });
  }

  return data;
}

// Only sync file to DB if DB is empty (first run)
const itemCount = await CATEGORY_ITEMS.countDocuments();
if (itemCount === 0) {
  // console.log("DB is empty, syncing from file...");
  await syncFileToDb();
}
