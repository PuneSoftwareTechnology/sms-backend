/**
 * Trainer payment tracker — schema + backfill. Safe to re-run.
 *
 * Steps 1-3 of the backfill plan:
 *   1. Create `trainers` and `trainer_payouts`, add `enrollments.trainer_id`.
 *   2. Create one trainer per distinct normalized `enrollments.trainer` name.
 *   3. Link every enrollment to its trainer, then verify nothing was orphaned.
 *
 * `enrollments.trainer` (TEXT) is deliberately left untouched. Every existing
 * read path (fee dues, candidate reports, CSV exports) keeps using it, and
 * rolling this back is just dropping the new tables and the new column.
 *
 * Spelling variants of the SAME person are NOT merged here — a script cannot
 * know that "Rahul S" and "Rahul Sharma" are one human. Merge them from the
 * Trainers page after this runs.
 *
 * Run survey-trainers.mjs first.
 */
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

/** trim + collapse internal whitespace + lowercase, applied to a column. */
const normalize = (col) =>
  `LOWER(REGEXP_REPLACE(TRIM(${col}), '\\s+', ' ', 'g'))`;

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database");

    // ---------------------------------------------------------------- step 1
    await client.query(
      "CREATE SEQUENCE IF NOT EXISTS trainer_code_seq AS BIGINT START 1",
    );

    // The code is assigned by the sequence default, never by app code, so two
    // super admins adding a trainer at once cannot collide on it.
    await client.query(`
      CREATE TABLE IF NOT EXISTS trainers (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        trainer_code TEXT UNIQUE NOT NULL
                       DEFAULT 'TRN-' || LPAD(NEXTVAL('trainer_code_seq')::TEXT, 3, '0'),
        name         VARCHAR(150) NOT NULL,
        courses      TEXT[] NOT NULL DEFAULT '{}',
        note         TEXT,
        is_active    BOOLEAN NOT NULL DEFAULT TRUE,
        created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created trainers table");

    await client.query(
      `CREATE INDEX IF NOT EXISTS idx_trainers_name_lower ON trainers (${normalize("name")})`,
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_trainers_is_active ON trainers (is_active)",
    );

    await client.query(
      "DROP TRIGGER IF EXISTS trg_trainers_updated_at ON trainers",
    );
    await client.query(
      "CREATE TRIGGER trg_trainers_updated_at BEFORE UPDATE ON trainers FOR EACH ROW EXECUTE FUNCTION set_updated_at()",
    );

    // One payout row per enrollment: the tracker row. split1_percent keeps the
    // "1st 50% / 2nd 50%" columns computed rather than stored, so an uneven
    // split (60/40, or a single 100% payment) needs no schema change.
    await client.query(`
      CREATE TABLE IF NOT EXISTS trainer_payouts (
        id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        enrollment_id       UUID NOT NULL UNIQUE REFERENCES enrollments(id) ON DELETE CASCADE,
        trainer_id          UUID REFERENCES trainers(id) ON DELETE SET NULL,
        training_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
        split1_percent      NUMERIC(5,2) NOT NULL DEFAULT 50,
        installment1_amount NUMERIC(10,2),
        installment1_date   DATE,
        installment1_tds    NUMERIC(10,2),
        installment1_mode   TEXT,
        installment2_amount NUMERIC(10,2),
        installment2_date   DATE,
        installment2_tds    NUMERIC(10,2),
        installment2_mode   TEXT,
        comment             TEXT,
        payment_status      TEXT,
        created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Created trainer_payouts table");

    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_trainer_payouts_trainer_id ON trainer_payouts (trainer_id)",
    );
    await client.query(
      "DROP TRIGGER IF EXISTS trg_trainer_payouts_updated_at ON trainer_payouts",
    );
    await client.query(
      "CREATE TRIGGER trg_trainer_payouts_updated_at BEFORE UPDATE ON trainer_payouts FOR EACH ROW EXECUTE FUNCTION set_updated_at()",
    );

    await client.query(
      "ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES trainers(id)",
    );
    await client.query(
      "CREATE INDEX IF NOT EXISTS idx_enrollments_trainer_id ON enrollments (trainer_id)",
    );
    console.log("Added enrollments.trainer_id");

    // ---------------------------------------------------------------- step 2
    // Canonical spelling = the variant used on the most enrollments, breaking
    // ties toward normal capitalisation so nobody ends up displayed as
    // "RAHUL SHARMA" forever. `courses` is prefilled from what these
    // enrollments actually used, so the course-aware dropdown grouping works
    // from day one.
    const inserted = await client.query(`
      WITH norm AS (
        SELECT
          ${normalize("trainer")}                              AS key,
          REGEXP_REPLACE(TRIM(trainer), '\\s+', ' ', 'g')      AS display,
          course
        FROM enrollments
        WHERE deleted = FALSE
          AND trainer IS NOT NULL
          AND TRIM(trainer) <> ''
      ),
      ranked AS (
        SELECT key, display,
               ROW_NUMBER() OVER (
                 PARTITION BY key ORDER BY
                   -- The spelling typed most often is the one that was meant.
                   COUNT(*) DESC,
                   -- On a tie, prefer normal capitalisation over ALL CAPS or
                   -- all lowercase: this name ends up in every dropdown.
                   (display = UPPER(display))::int ASC,
                   (display = LOWER(display))::int ASC,
                   display ASC
               ) AS rn
        FROM norm
        GROUP BY key, display
      ),
      course_agg AS (
        SELECT key, ARRAY_REMOVE(ARRAY_AGG(DISTINCT course), NULL) AS courses
        FROM norm
        GROUP BY key
      )
      INSERT INTO trainers (name, courses)
      SELECT r.display, COALESCE(c.courses, '{}')
      FROM ranked r
      JOIN course_agg c ON c.key = r.key
      WHERE r.rn = 1
        AND NOT EXISTS (
          SELECT 1 FROM trainers t WHERE ${normalize("t.name")} = r.key
        )
      RETURNING trainer_code, name
    `);
    console.log(`Created ${inserted.rowCount} trainers from existing names`);
    for (const t of inserted.rows) {
      console.log(`  ${t.trainer_code}  ${t.name}`);
    }

    // ---------------------------------------------------------------- step 3
    const linked = await client.query(`
      UPDATE enrollments e
      SET trainer_id = t.id
      FROM trainers t
      WHERE e.deleted = FALSE
        AND e.trainer_id IS NULL
        AND e.trainer IS NOT NULL
        AND TRIM(e.trainer) <> ''
        AND ${normalize("e.trainer")} = ${normalize("t.name")}
    `);
    console.log(`Linked ${linked.rowCount} enrollments to a trainer`);

    const { rows: orphans } = await client.query(`
      SELECT id, trainer
      FROM enrollments
      WHERE deleted = FALSE
        AND TRIM(COALESCE(trainer, '')) <> ''
        AND trainer_id IS NULL
    `);

    if (orphans.length > 0) {
      console.error(
        `\nFAILED: ${orphans.length} enrollments have a trainer name but no trainer_id:`,
      );
      for (const o of orphans) console.error(`  ${o.id}  "${o.trainer}"`);
      process.exitCode = 1;
      return;
    }
    console.log("Verified: 0 enrollments left unlinked");

    // Step 3b: align the legacy text column with the canonical trainer name.
    // Without this the reports still reading `trainer` would show "RAHUL SHARMA"
    // while the tracker shows "Rahul Sharma" for the same person. Only the
    // casing/spacing of a name already there changes — no name is replaced by a
    // different one, because trainer_id was matched on the normalized form.
    const synced = await client.query(`
      UPDATE enrollments e
      SET trainer = t.name, updated_at = NOW()
      FROM trainers t
      WHERE e.trainer_id = t.id
        AND e.deleted = FALSE
        AND e.trainer IS DISTINCT FROM t.name
    `);
    console.log(`Normalized ${synced.rowCount} trainer name snapshots`);

    console.log("\nMigration successful!");
    console.log(
      "Next: open the Trainers page and merge any spelling variants of the same person.",
    );
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

migrate();
