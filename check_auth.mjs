import pg from "pg";
const { Client } = pg;

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjM2ZDdlOTZlLWQ3NTUtNDIxMi05Nzg4LTRkMzc0ZTIwMDgxOSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc3MTU3OTU5NSwiZXhwIjoxNzc0MTcxNTk1fQ.EWMC6u20ydsLS7vDV_rsV2VbVinKAonMqyuWncqQSMk";

const client = new Client({
  connectionString:
    "postgresql://neondb_owner:npg_ngJc93jQawmC@ep-super-snow-a1edrfb3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

await client.connect();

// 1. Is token blacklisted?
const bl = await client.query(
  "SELECT EXISTS(SELECT 1 FROM token_blacklist WHERE token = $1 AND expires_at > NOW()) AS blacklisted",
  [token],
);
console.log("Blacklisted?", bl.rows[0].blacklisted);

// 2. Is the user active?
const user = await client.query(
  "SELECT id, email, role, is_active FROM users WHERE id = '36d7e96e-d755-4212-9788-4d374e200819'",
);
console.log("User:", user.rows[0] ?? "NOT FOUND");

await client.end();
