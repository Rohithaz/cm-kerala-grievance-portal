import app from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';
import { validateAuthConfiguration } from './utils/authTokens.js';

validateAuthConfiguration();
const server = app.listen(env.port, () => console.log(`CM Kerala API listening on port ${env.port}`));
let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`${signal} received; shutting down.`);
  server.close(async () => { await pool.end(); process.exit(0); });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));