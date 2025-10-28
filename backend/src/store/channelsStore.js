import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd(), "backend/data");
const CHANNELS_FILE = path.join(DATA_DIR, "channels.json");

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(CHANNELS_FILE)) fs.writeFileSync(CHANNELS_FILE, JSON.stringify({ channels: [] }, null, 2));
}

export class ChannelsStore {
  constructor() {
    ensure();
  }

  list() {
    return JSON.parse(fs.readFileSync(CHANNELS_FILE, "utf-8")).channels;
  }

  get(channelId) {
    return this.list().find((c) => c.channelId === channelId);
  }

  upsert(channel) {
    const data = JSON.parse(fs.readFileSync(CHANNELS_FILE, "utf-8"));
    const idx = data.channels.findIndex((c) => c.channelId === channel.channelId);
    if (idx === -1) data.channels.push(channel);
    else data.channels[idx] = { ...data.channels[idx], ...channel };
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(data, null, 2));
    return channel;
  }

  remove(channelId) {
    const data = JSON.parse(fs.readFileSync(CHANNELS_FILE, "utf-8"));
    const idx = data.channels.findIndex((c) => c.channelId === channelId);
    if (idx === -1) return null;
    const [removed] = data.channels.splice(idx, 1);
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(data, null, 2));
    return removed;
  }
}
