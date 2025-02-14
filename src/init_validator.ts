export function validate() {
    if (!process.env.JWT) {
        console.log("Env: JWT not set");
        process.exit(1);
    }
    if (!process.env.MONGO_URI) {
        console.log("Env: MONGO_URI not set");
        process.exit(1);
    }
}
