import { syncFromMongoToCategories } from "../dbUtils/categories_schema.ts";
import type { Webhook } from "../webhook/traits.ts";
import { CustomError } from "../errors/error.ts";

export async function startCategoriesSync(webhook: Webhook) {
  console.log("Categories sync task initialized");

  setInterval(async () => {
    try {
      await syncFromMongoToCategories();
    } catch (err) {
      console.error("Error in categories sync task:", err);
      await webhook.send(new CustomError(err as Error));
    }
  }, 10000); // Run every 10 seconds

  console.log("Categories sync scheduled to run every 10 seconds");
}
