import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, "../../data");
const TOKENS_FILE = path.join(DATA_DIR, "tokens.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(TOKENS_FILE)) fs.writeFileSync(TOKENS_FILE, JSON.stringify({ meta: {} }, null, 2));
}

function read() {
  ensure();
  return JSON.parse(fs.readFileSync(TOKENS_FILE, "utf-8"));
}

function write(data) {
  ensure();
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(data, null, 2));
}

export const TokenStore = {
  getAll() { return read(); },
  setMetaTokens(metaTokens) {
    const data = read();
    data.meta = metaTokens || {};
    write(data);
    return data.meta;
  },
  getMetaTokens() {
    const data = read();
    return data.meta || {};
  },
};
