import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Every table that stores the institute code as a plain string.
const TABLES = ["enquiries", "enrollments"];

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database");

    for (const table of TABLES) {
      const { rowCount } = await client.query(
        `UPDATE ${table} SET institute = 'TECHVAA' WHERE institute = 'PST'`,
      );
      console.log(`${table}: renamed ${rowCount} row(s) from PST to TECHVAA`);
    }

    // Nothing should be left on the old code — report it rather than failing
    // silently if another table picks up an institute column later.
    for (const table of TABLES) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS remaining FROM ${table} WHERE institute = 'PST'`,
      );
      if (rows[0].remaining > 0) {
        console.warn(`${table}: ${rows[0].remaining} row(s) still on PST`);
      }
    }

    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

migrate();
