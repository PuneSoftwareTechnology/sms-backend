import { Pool  } from 'pg';
import env from './env.js';
const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;