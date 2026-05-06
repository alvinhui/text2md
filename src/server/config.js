const path = require("node:path");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const CLIENT_DIR = path.join(ROOT_DIR, "src", "client");
const REQUEST_TIMEOUT_MS = 6_000;
const MAX_RETRIES = 1;
const HOST = "0.0.0.0";
const PORT = Number(process.argv[2] || 8080);

module.exports = {
  ROOT_DIR,
  CLIENT_DIR,
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  HOST,
  PORT,
};
