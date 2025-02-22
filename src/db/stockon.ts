import {MongoClient, Db} from "mongodb";

export const enum DBCollection {
    STOCKON = "stockon",
}

export class Stockon {
    private client: MongoClient | null = null;
    public db: Db | null = null;

    public static async init(uri: string, db: DBCollection): Promise<Stockon> {
        let stockon = new Stockon();
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
        // Ensure categories collection exists
        const categoriesCollectionExists = await this.db
            .listCollections({name: "categories"})
            .hasNext();
        if (!categoriesCollectionExists) {
            await this.db.createCollection("categories");
            console.log("Created categories collection");
        }

        // Ensure orders collection exists
        const ordersCollectionExists = await this.db
            .listCollections({name: "orders"})
            .hasNext();
        if (!ordersCollectionExists) {
            await this.db.createCollection("orders");
            console.log("Created orders collection");
        }
    }

    public async close(): Promise<void> {
        if (!this.client) {
            return;
        }
        await this.client.close();
    }
}

export default Stockon;
