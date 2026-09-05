/**
 * Trainer PAN, bank details, fees and comment. Safe to re-run.
 *
 * These columns are record-keeping only: nothing reads them apart from the
 * Trainers page itself. In particular `trainers.fees` is NOT wired into
 * trainer_payouts.training_fee — the payout tracker keeps its own per-student
 * figure, and quietly defaulting one from the other would rewrite payment
 * history the next time somebody edited the trainer.
 *
 * Account numbers are TEXT, never numeric: they are identifiers with leading
 * zeros, not quantities.
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const COLUMNS = [
  ["pan_number", "TEXT"],
  ["bank_beneficiary_name", "TEXT"],
  ["bank_name", "TEXT"],
  ["bank_ifsc", "TEXT"],
  ["bank_account_number", "TEXT"],
  // The trainer's standing rate, kept for reference. Nullable on purpose:
  // 0 would read as "works for free" rather than "not recorded yet".
  ["fees", "NUMERIC(10,2)"],
  ["comment", "TEXT"],
];

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database");

    for (const [column, type] of COLUMNS) {
      await client.query(
        `ALTER TABLE trainers ADD COLUMN IF NOT EXISTS ${column} ${type}`,
      );
      console.log(`Added trainers.${column}`);
    }

    console.log("\nMigration successful!");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

migrate();
