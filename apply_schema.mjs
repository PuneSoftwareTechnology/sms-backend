import pg from "pg";
import fs from "fs";

const { Client } = pg;
const client = new Client({
  connectionString:
    "postgresql://neondb_owner:npg_ngJc93jQawmC@ep-super-snow-a1edrfb3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

await client.connect();
const schema = fs.readFileSync("./src/db/schema.sql", "utf8");
await client.query(schema);
console.log("✅ Schema applied successfully");
await client.end();
