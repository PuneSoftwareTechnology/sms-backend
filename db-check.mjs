import pg from "pg";
const { Client } = pg;

const client = new Client({
  connectionString:
    "postgresql://neondb_owner:npg_ngJc93jQawmC@ep-super-snow-a1edrfb3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

try {
  await client.connect();
  const res = await client.query("SELECT * FROM enrollments LIMIT 1");
  console.log("Column Names:", Object.keys(res.rows[0] || {}));
  console.log("Sample Data:", res.rows[0]);
} catch (err) {
  console.error(err);
} finally {
  await client.end();
}
