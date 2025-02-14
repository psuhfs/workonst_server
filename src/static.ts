import categories from "../categories_schema.json" assert { type: "json" }; // This load the json in memory, so the responses are superfast.

export function categoriesJson(): any {
    return categories;
}