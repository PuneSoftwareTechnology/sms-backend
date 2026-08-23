/**
 * Step 0 of the trainer backfill — READ ONLY. Writes nothing.
 *
 * Dumps every distinct `enrollments.trainer` free-text value alongside the
 * normalized key the backfill will group on, so the spelling variants that a
 * script cannot safely merge ("Rahul S" vs "Rahul Sharma") are reviewed by a
 * human before `add-trainers-and-payouts.mjs` runs.
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function survey() {
  try {
    await client.connect();
    console.log("Connected to database (read-only survey)\n");

    const { rows } = await client.query(`
      SELECT
        trainer                                                       AS raw,
        LOWER(REGEXP_REPLACE(TRIM(trainer), '\\s+', ' ', 'g'))        AS normalized,
        COUNT(*)::int                                                 AS enrollments,
        ARRAY_REMOVE(ARRAY_AGG(DISTINCT course), NULL)                AS courses
      FROM enrollments
      WHERE deleted = FALSE
        AND trainer IS NOT NULL
        AND TRIM(trainer) <> ''
      GROUP BY 1, 2
      ORDER BY normalized, enrollments DESC
    `);

    const { rows: blanks } = await client.query(`
      SELECT COUNT(*)::int AS count
      FROM enrollments
      WHERE deleted = FALSE
        AND (trainer IS NULL OR TRIM(trainer) = '')
    `);

    const groups = new Map();
    for (const r of rows) {
      if (!groups.has(r.normalized)) groups.set(r.normalized, []);
      groups.get(r.normalized).push(r);
    }

    console.log(`Distinct raw trainer values : ${rows.length}`);
    console.log(`Distinct normalized names   : ${groups.size}`);
    console.log(`Enrollments with no trainer : ${blanks[0].count}\n`);

    console.log("normalized | raw spellings (enrollments) | courses");
    console.log("-".repeat(90));
    for (const [normalized, variants] of groups) {
      const spellings = variants
        .map((v) => `"${v.raw}" (${v.enrollments})`)
        .join(", ");
      const courses = [
        ...new Set(variants.flatMap((v) => v.courses ?? [])),
      ].join(", ");
      const flag = variants.length > 1 ? " <-- multiple spellings" : "";
      console.log(`${normalized} | ${spellings} | ${courses}${flag}`);
    }

    console.log("\nCSV:");
    console.log("normalized,raw,enrollments,courses");
    for (const r of rows) {
      const courses = (r.courses ?? []).join("; ");
      console.log(
        `"${r.normalized}","${r.raw}",${r.enrollments},"${courses}"`,
      );
    }

    console.log(
      "\nReview the rows flagged above, then run add-trainers-and-payouts.mjs.",
    );
    console.log(
      "Spellings that are the SAME person get merged afterwards from the Trainers page.",
    );
  } catch (err) {
    console.error("Survey failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

survey();
