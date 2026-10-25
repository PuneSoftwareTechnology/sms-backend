/**
 * trainers.fees NUMERIC(10,2) → TEXT. Safe to re-run.
 *
 * Trainer rates are agreed as "40% of course fees" or "15k for Agentic AI, 12k
 * for Python full stack" as often as a flat amount, so the field is free text.
 * Existing amounts are kept, with trailing zeros dropped (15000.00 → "15000").
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database");

    const { rows } = await client.query(
      `SELECT data_type FROM information_schema.columns
        WHERE table_name = 'trainers' AND column_name = 'fees'`,
    );
    if (rows[0]?.data_type === "text") {
      console.log("trainers.fees is already TEXT — nothing to do");
      return;
    }

    await client.query(
      `ALTER TABLE trainers
         ALTER COLUMN fees TYPE TEXT USING trim_scale(fees)::text`,
    );
    console.log("Changed trainers.fees to TEXT");

    console.log("\nMigration successful!");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

migrate();
