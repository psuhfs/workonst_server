import {MongoClient, Db} from "mongodb";

export const enum DBCollection {
    STOCKON = "stockon",
}

export const enum Collections {
    CATEGORIES = "categories",
    ORDERS = "orders",
    CREW_MEMBERS = "crew_members",
}

export class MongoDB {
    private client: MongoClient | null = null;
    public db: Db | null = null;

    public static async init(uri: string, db: DBCollection): Promise<MongoDB> {
        let stockon = new MongoDB();
        await stockon.connect(uri, db);
        return stockon;
    }

    private async connect(uri: string, db: DBCollection): Promise<void> {
        try {
            this.client = new MongoClient(uri);
            await this.client.connect();
            this.db = this.client.db(db as string);

            // Create collections if they don't exist
            await this.initializeCollections();

            console.log("Connected to MongoDB successfully");
        } catch (error) {
            console.error("Failed to connect to MongoDB:", error);
            throw error;
        }
    }

    private async initializeCollections(): Promise<void> {
        if (!this.db) {
            return;
        }
        // Ensure all collection exists
        for (const collection of Object.values(Collections)) {
            const categoriesCollectionExists = await this.db
                .listCollections({name: (collection as string)})
                .hasNext();
            if (!categoriesCollectionExists) {
                await this.db.createCollection(collection as string);
                console.log(`Created ${collection} collection`);
            }
        }
    }

    public async close(): Promise<void> {
        if (!this.client) {
            return;
        }
        await this.client.close();
    }
}

export default MongoDB;
