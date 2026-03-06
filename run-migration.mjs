import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString:
    "postgresql://neondb_owner:npg_ngJc93jQawmC@ep-super-snow-a1edrfb3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database");

    await client.query(
      "ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS institute VARCHAR(50)",
    );
    console.log("Added institute column");

    await client.query(
      "ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS total_fee NUMERIC(10,2) DEFAULT 0",
    );
    console.log("Added total_fee column");

    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}

migrate();
