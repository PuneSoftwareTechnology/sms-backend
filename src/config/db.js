import { Pool } from 'pg';
import env from './env.js';

const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  ...(isLambda && {
    max: 1,
    idleTimeoutMillis: 0,
    connectionTimeoutMillis: 5000,
  }),
});

export default pool;
