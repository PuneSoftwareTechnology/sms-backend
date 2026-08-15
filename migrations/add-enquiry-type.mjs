import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database");

    await client.query(
      "ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS enquiry_type VARCHAR(20) DEFAULT 'WALKIN'",
    );
    console.log("Added enquiry_type column");

    const { rowCount } = await client.query(
      "UPDATE enquiries SET enquiry_type = 'WALKIN' WHERE enquiry_type IS NULL",
    );
    console.log(`Backfilled ${rowCount} existing enquiries to WALKIN`);

    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

migrate();
