import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "backend/data");
const BINDINGS_FILE = path.join(DATA_DIR, "bindings.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BINDINGS_FILE)) fs.writeFileSync(BINDINGS_FILE, JSON.stringify({ bindings: [] }, null, 2));
}

export class BindingsStore {
  constructor() {
    ensure();
  }

  list() {
    return JSON.parse(fs.readFileSync(BINDINGS_FILE, "utf-8")).bindings;
  }

  getByChannel(channelId) {
    return this.list().find((b) => b.channelId === channelId);
  }

  upsert(binding) {
    const data = JSON.parse(fs.readFileSync(BINDINGS_FILE, "utf-8"));
    const idx = data.bindings.findIndex((b) => b.channelId === binding.channelId);
    if (idx === -1) data.bindings.push(binding);
    else data.bindings[idx] = { ...data.bindings[idx], ...binding };
    fs.writeFileSync(BINDINGS_FILE, JSON.stringify(data, null, 2));
    return binding;
  }

  remove(channelId) {
    const data = JSON.parse(fs.readFileSync(BINDINGS_FILE, "utf-8"));
    const idx = data.bindings.findIndex((b) => b.channelId === channelId);
    if (idx === -1) return null;
    const [removed] = data.bindings.splice(idx, 1);
    fs.writeFileSync(BINDINGS_FILE, JSON.stringify(data, null, 2));
    return removed;
  }
}
