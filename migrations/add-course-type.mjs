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
      "ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type VARCHAR(20) NOT NULL DEFAULT 'ENQUIRY'",
    );
    console.log("Added course_type column (existing rows default to ENQUIRY)");

    // Enrollment and enquiry lists are independent, so a name may appear once
    // per type rather than once overall.
    await client.query(
      "ALTER TABLE courses DROP CONSTRAINT IF EXISTS uq_courses_name",
    );
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_courses_name_type'
        ) THEN
          ALTER TABLE courses
            ADD CONSTRAINT uq_courses_name_type UNIQUE (name, course_type);
        END IF;
      END
      $$;
    `);
    console.log("Replaced UNIQUE(name) with UNIQUE(name, course_type)");

    // Seed the enrollment list from course names already used on enrollments so
    // the new dropdown is not empty on first load.
    const { rowCount } = await client.query(`
      INSERT INTO courses (name, course_type, is_active)
      SELECT DISTINCT TRIM(e.course), 'ENROLLMENT', true
        FROM enrollments e
       WHERE e.deleted = FALSE
         AND e.course IS NOT NULL AND TRIM(e.course) <> ''
      ON CONFLICT (name, course_type) DO NOTHING
    `);
    console.log(`Seeded ${rowCount} enrollment course(s) from existing enrollments`);

    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

migrate();
