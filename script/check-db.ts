import "dotenv/config";
import { db } from "../server/db";
import { offices } from "@shared/schema";

async function main() {
    try {
        console.log("Checking Supabase connection...\nConnecting to:", process.env.DATABASE_URL?.split('@')[1]);
        const res = await db.select().from(offices).limit(1);
        console.log("Database connection successful!");
        console.log("Offices found:", res.length);
        console.log("Data:", res);
    } catch (err) {
        console.error("Database connection failed:", err);
    }
    process.exit(0);
}

main();
