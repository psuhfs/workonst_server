import mongoose from "mongoose";
import { Collections, DBCollection } from "../handler/utils.ts";
import fs from "fs/promises";
import { DateTime } from "luxon";

const uri = process.env.MONGO_URI;
await mongoose.connect(uri ? uri : "", {
  dbName: DBCollection.STOCKON,
});

const itemSchema = new mongoose.Schema(
  {
    item_id: { type: String, required: true },
    name: { type: String, required: true },
    unit_sz: { type: String, required: true },
  },
  { _id: false }
);

const areaSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    info: {
      type: Map,
      of: [itemSchema],
    },
  },
  { _id: false }
);

const categoriesSchema = new mongoose.Schema(
  {
    location: { type: String, required: true, unique: true },
    areas: [areaSchema],
    lastSynced: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const CATEGORIES_SCHEMA = mongoose.model(
  Collections.CATEGORIES,
  categoriesSchema
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
      Stacks: transformToCategories(stacks),
      Biscotti: transformToCategories(biscotti),
      Provisions: transformToCategories(provisions),
      Outpost: transformToCategories(outpost),
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
    // console.log("Starting sync from MongoDB collections...");
    
    const scrapedData = await scrapeFromMongo();
    if (!scrapedData) {
      console.error("Failed to scrape data from MongoDB");
      return;
    }

    const hasData = Object.values(scrapedData).some(
      (loc: any) => loc.areas && loc.areas.length > 0
    );
    
    if (!hasData) {
      // console.warn("Scraped data is empty");
      return;
    }

    const currentData = await getCategories();

    if (deepEqual(scrapedData, currentData)) {
      console.log("No changes detected, skipping sync");
      return;
    }

    console.log("Changes detected, creating backup...");
    await createBackup();

    for (const [location, config] of Object.entries(scrapedData)) {
      await CATEGORIES_SCHEMA.findOneAndUpdate(
        { location },
        { location, areas: (config as any).areas, lastSynced: new Date() },
        { upsert: true, new: true }
      );
    }

    await syncDbToFile();
    console.log("Categories synced from MongoDB collections");
  } catch (e) {
    console.error("Error syncing from MongoDB:", e);
  }
}

async function syncFileToDb() {
  try {
    const fileContent = await Bun.file(CATEGORIES_FILE).text();
    const data = JSON.parse(fileContent);

    for (const [location, config] of Object.entries(data)) {
      await CATEGORIES_SCHEMA.findOneAndUpdate(
        { location },
        { location, areas: (config as any).areas, lastSynced: new Date() },
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
    const categories = await CATEGORIES_SCHEMA.find({});
    const data: any = {};

    for (const category of categories) {
      data[category.location] = {
        areas: category.areas,
      };
    }

    await fs.writeFile(CATEGORIES_FILE, JSON.stringify(data, null, 2));
    console.log("Categories synced from DB to file");
  } catch (e) {
    console.error("Error syncing DB to file:", e);
  }
}

export async function getCategories(): Promise<any> {
  const categories = await CATEGORIES_SCHEMA.find({});
  const data: any = {};

  for (const category of categories) {
    data[category.location] = {
      areas: category.areas,
    };
  }

  return data;
}

await syncFileToDb();
