import net from 'node:net';
import dns from 'node:dns';
import { Pool } from 'pg';
import env from './env.js';

// pg 8.x does not forward `family` to net.connect, so force IPv4 at the Node level.
// Our network has no IPv6 route to RDS; happy-eyeballs was burning connect budget on AAAA records.
dns.setDefaultResultOrder('ipv4first');
net.setDefaultAutoSelectFamily(false);

const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: {
    rejectUnauthorized: false,
  },
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ...(isLambda
    ? {
      max: 1,
      idleTimeoutMillis: 0,
      connectionTimeoutMillis: 5000,
    }
    : {
      max: 20,
      connectionTimeoutMillis: 10_000,
    }),
});

export default pool;
