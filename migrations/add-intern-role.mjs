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

    // users.role may be a native enum or plain text depending on when the
    // database was provisioned. Only the enum case needs a new label.
    const { rows } = await client.query(`
      SELECT t.typname, c.data_type
        FROM information_schema.columns c
        JOIN pg_type t ON t.typname = c.udt_name
       WHERE c.table_name = 'users' AND c.column_name = 'role'
    `);
    const column = rows[0];

    if (column?.data_type === "USER-DEFINED") {
      await client.query(
        `ALTER TYPE ${column.typname} ADD VALUE IF NOT EXISTS 'INTERN'`,
      );
      console.log(`Added 'INTERN' to enum ${column.typname}`);
    } else {
      console.log(
        `users.role is ${column?.data_type ?? "missing"} — no enum change needed`,
      );
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
