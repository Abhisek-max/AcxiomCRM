import app from './app.js';
import { env, validateEnvironment } from './config/env.js';
validateEnvironment();
const server = app.listen(env.port, () => console.log(`AcxiomCRM API listening on http://localhost:${env.port}`));
function shutdown(signal) { console.log(`${signal} received; closing server.`); server.close(() => process.exit(0)); }
process.on('SIGINT', () => shutdown('SIGINT')); process.on('SIGTERM', () => shutdown('SIGTERM'));
