import path from "node:path";

export type Group = {
  id: string;
  name: string;
  color: string;
  position: number;
};

export type Tag = {
  id: string;
  name: string;
  color: string;
  group_ids: string[];
};

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  note: string | null;
  tag_ids: string[];
};

const NEW_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS groups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tag_groups (
    tag_id TEXT NOT NULL,
    group_id TEXT NOT NULL,
    PRIMARY KEY (tag_id, group_id)
  )`,
  `CREATE TABLE IF NOT EXISTS entry_tags (
    entry_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (entry_id, tag_id)
  )`,
];

const ENTRIES_TABLE_NEW = `CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    note TEXT
  )`;

// ---- color helpers (used only to derive seed-time tag shades from a group's base hue) ----

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let [r, g, b] = [0, 0, 0];
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = lN - c / 2;
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function shadesForGroup(baseHex: string, count: number): string[] {
  const { h, s, l } = hexToHsl(baseHex);
  if (count <= 1) return [baseHex];
  const minL = Math.max(28, l - 18);
  const maxL = Math.min(70, l + 18);
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    colors.push(hslToHex(h, s, minL + t * (maxL - minL)));
  }
  return colors;
}

// ---- seed data ----

const DEFAULT_GROUPS: Omit<Group, "id">[] & { id: string }[] = [
  { id: "grp-sport", name: "Sport", color: "#2a78d6", position: 0 },
  { id: "grp-work", name: "Work", color: "#008300", position: 1 },
  { id: "grp-social", name: "Social", color: "#e87ba4", position: 2 },
  { id: "grp-freetime", name: "Free time", color: "#eda100", position: 3 },
  { id: "grp-sleep", name: "Sleep", color: "#1baf7a", position: 4 },
  { id: "grp-eat", name: "Eat", color: "#eb6834", position: 5 },
];

// Each tag: id, name, primary group (drives its color shade), extra groups it also appears under.
const DEFAULT_TAG_DEFS: { id: string; name: string; primaryGroup: string; extraGroups?: string[] }[] = [
  { id: "tag-cycling", name: "Cycling", primaryGroup: "grp-sport" },
  { id: "tag-running", name: "Running", primaryGroup: "grp-sport" },
  { id: "tag-swimming", name: "Swimming", primaryGroup: "grp-sport" },
  { id: "tag-hiking", name: "Hiking", primaryGroup: "grp-sport" },
  { id: "tag-other-sport", name: "Other sport", primaryGroup: "grp-sport" },
  { id: "tag-social-sport", name: "Social sport", primaryGroup: "grp-sport", extraGroups: ["grp-social"] },
  { id: "tag-phd-microfab", name: "PhD · Microfab", primaryGroup: "grp-work" },
  { id: "tag-phd-electronic", name: "PhD · Electronic", primaryGroup: "grp-work" },
  { id: "tag-phd-admin", name: "PhD · Admin", primaryGroup: "grp-work" },
  { id: "tag-mint", name: "Mint", primaryGroup: "grp-work" },
  { id: "tag-work-social", name: "Work social", primaryGroup: "grp-work", extraGroups: ["grp-social"] },
  { id: "tag-outings", name: "Outings", primaryGroup: "grp-social" },
  { id: "tag-watching", name: "Watching something", primaryGroup: "grp-freetime" },
  { id: "tag-reading", name: "Reading", primaryGroup: "grp-freetime" },
  { id: "tag-a", name: "A", primaryGroup: "grp-freetime" },
  { id: "tag-friends", name: "Friends", primaryGroup: "grp-freetime" },
  { id: "tag-sleep", name: "Sleep", primaryGroup: "grp-sleep" },
  { id: "tag-eat", name: "Eat", primaryGroup: "grp-eat" },
];

function buildSeedTags(): { tag: { id: string; name: string; color: string }; groupIds: string[] }[] {
  const byGroup = new Map<string, typeof DEFAULT_TAG_DEFS>();
  for (const def of DEFAULT_TAG_DEFS) {
    const list = byGroup.get(def.primaryGroup) || [];
    list.push(def);
    byGroup.set(def.primaryGroup, list);
  }
  const result: { tag: { id: string; name: string; color: string }; groupIds: string[] }[] = [];
  for (const group of DEFAULT_GROUPS) {
    const defs = byGroup.get(group.id) || [];
    const colors = shadesForGroup(group.color, defs.length);
    defs.forEach((def, i) => {
      result.push({
        tag: { id: def.id, name: def.name, color: colors[i] },
        groupIds: [def.primaryGroup, ...(def.extraGroups || [])],
      });
    });
  }
  return result;
}

interface DbDriver {
  getGroups(): Promise<Group[]>;
  createGroup(group: { id: string; name: string; color: string; position: number }): Promise<void>;
  updateGroup(id: string, name: string, color: string): Promise<void>;
  deleteGroup(id: string): Promise<void>;

  getTags(): Promise<Tag[]>;
  createTag(tag: { id: string; name: string; color: string }, groupIds: string[]): Promise<void>;
  updateTag(id: string, name: string, color: string, groupIds: string[]): Promise<void>;
  deleteTag(id: string): Promise<void>;

  getEntries(startDate: string, endDate: string): Promise<Entry[]>;
  createEntry(entry: Omit<Entry, "tag_ids">, tagIds: string[]): Promise<void>;
  updateEntry(entry: Omit<Entry, "tag_ids">, tagIds: string[]): Promise<void>;
  deleteEntry(id: string): Promise<void>;
}

class SqliteDriver implements DbDriver {
  private db: import("better-sqlite3").Database;

  constructor() {
    const Database = require("better-sqlite3");
    const file = path.join(process.cwd(), "data.db");
    this.db = new Database(file);
    this.db.pragma("journal_mode = WAL");
    this.migrateLegacy();
    for (const stmt of NEW_SCHEMA) this.db.exec(stmt);
    this.db.exec(ENTRIES_TABLE_NEW);
    this.seedIfEmpty();
  }

  private migrateLegacy() {
    const tableExists = (name: string) =>
      !!this.db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?")
        .get(name);
    const columnExists = (table: string, column: string) =>
      (this.db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).some(
        (c) => c.name === column
      );

    if (tableExists("entries") && columnExists("entries", "category_id")) {
      this.db.exec(`CREATE TABLE entries_new (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        note TEXT
      )`);
      this.db.exec(
        "INSERT INTO entries_new (id, date, start_time, end_time, note) SELECT id, date, start_time, end_time, note FROM entries"
      );
      this.db.exec("CREATE TABLE IF NOT EXISTS entry_tags (entry_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (entry_id, tag_id))");
      this.db.exec(
        "INSERT OR IGNORE INTO entry_tags (entry_id, tag_id) SELECT id, category_id FROM entries WHERE category_id IS NOT NULL AND category_id != ''"
      );
      this.db.exec("DROP TABLE entries");
      this.db.exec("ALTER TABLE entries_new RENAME TO entries");
    }

    if (tableExists("categories") && !tableExists("tags")) {
      this.db.exec(`CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL)`);
      this.db.exec("INSERT INTO tags (id, name, color) SELECT id, name, color FROM categories");
    }
  }

  private seedIfEmpty() {
    const groupCount = this.db.prepare("SELECT COUNT(*) as c FROM groups").get() as {
      c: number;
    };
    if (groupCount.c === 0) {
      const insertGroup = this.db.prepare(
        "INSERT INTO groups (id, name, color, position) VALUES (?, ?, ?, ?)"
      );
      for (const g of DEFAULT_GROUPS) insertGroup.run(g.id, g.name, g.color, g.position);
    }

    const tagExists = this.db.prepare("SELECT 1 FROM tags WHERE id = ?");
    const insertTag = this.db.prepare("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)");
    const insertTagGroup = this.db.prepare(
      "INSERT INTO tag_groups (tag_id, group_id) VALUES (?, ?)"
    );
    for (const { tag, groupIds } of buildSeedTags()) {
      if (tagExists.get(tag.id)) continue;
      insertTag.run(tag.id, tag.name, tag.color);
      for (const gid of groupIds) insertTagGroup.run(tag.id, gid);
    }
  }

  async getGroups() {
    return this.db.prepare("SELECT * FROM groups ORDER BY position, name").all() as Group[];
  }

  async createGroup(group: { id: string; name: string; color: string; position: number }) {
    this.db
      .prepare("INSERT INTO groups (id, name, color, position) VALUES (?, ?, ?, ?)")
      .run(group.id, group.name, group.color, group.position);
  }

  async updateGroup(id: string, name: string, color: string) {
    this.db.prepare("UPDATE groups SET name = ?, color = ? WHERE id = ?").run(name, color, id);
  }

  async deleteGroup(id: string) {
    this.db.prepare("DELETE FROM tag_groups WHERE group_id = ?").run(id);
    this.db.prepare("DELETE FROM groups WHERE id = ?").run(id);
  }

  async getTags(): Promise<Tag[]> {
    const tags = this.db.prepare("SELECT * FROM tags ORDER BY name").all() as Omit<Tag, "group_ids">[];
    const links = this.db.prepare("SELECT tag_id, group_id FROM tag_groups").all() as {
      tag_id: string;
      group_id: string;
    }[];
    const byTag = new Map<string, string[]>();
    for (const link of links) {
      const list = byTag.get(link.tag_id) || [];
      list.push(link.group_id);
      byTag.set(link.tag_id, list);
    }
    return tags.map((t) => ({ ...t, group_ids: byTag.get(t.id) || [] }));
  }

  async createTag(tag: { id: string; name: string; color: string }, groupIds: string[]) {
    this.db
      .prepare("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)")
      .run(tag.id, tag.name, tag.color);
    const insertLink = this.db.prepare("INSERT INTO tag_groups (tag_id, group_id) VALUES (?, ?)");
    for (const gid of groupIds) insertLink.run(tag.id, gid);
  }

  async updateTag(id: string, name: string, color: string, groupIds: string[]) {
    this.db.prepare("UPDATE tags SET name = ?, color = ? WHERE id = ?").run(name, color, id);
    this.db.prepare("DELETE FROM tag_groups WHERE tag_id = ?").run(id);
    const insertLink = this.db.prepare("INSERT INTO tag_groups (tag_id, group_id) VALUES (?, ?)");
    for (const gid of groupIds) insertLink.run(id, gid);
  }

  async deleteTag(id: string) {
    this.db.prepare("DELETE FROM tag_groups WHERE tag_id = ?").run(id);
    this.db.prepare("DELETE FROM entry_tags WHERE tag_id = ?").run(id);
    this.db.prepare("DELETE FROM tags WHERE id = ?").run(id);
  }

  async getEntries(startDate: string, endDate: string): Promise<Entry[]> {
    const entries = this.db
      .prepare(
        "SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date, start_time"
      )
      .all(startDate, endDate) as Omit<Entry, "tag_ids">[];
    if (entries.length === 0) return [];
    const ids = entries.map((e) => e.id);
    const placeholders = ids.map(() => "?").join(",");
    const links = this.db
      .prepare(`SELECT entry_id, tag_id FROM entry_tags WHERE entry_id IN (${placeholders})`)
      .all(...ids) as { entry_id: string; tag_id: string }[];
    const byEntry = new Map<string, string[]>();
    for (const link of links) {
      const list = byEntry.get(link.entry_id) || [];
      list.push(link.tag_id);
      byEntry.set(link.entry_id, list);
    }
    return entries.map((e) => ({ ...e, tag_ids: byEntry.get(e.id) || [] }));
  }

  async createEntry(entry: Omit<Entry, "tag_ids">, tagIds: string[]) {
    this.db
      .prepare(
        "INSERT INTO entries (id, date, start_time, end_time, note) VALUES (?, ?, ?, ?, ?)"
      )
      .run(entry.id, entry.date, entry.start_time, entry.end_time, entry.note);
    const insertLink = this.db.prepare("INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)");
    for (const tagId of tagIds) insertLink.run(entry.id, tagId);
  }

  async updateEntry(entry: Omit<Entry, "tag_ids">, tagIds: string[]) {
    this.db
      .prepare(
        "UPDATE entries SET date = ?, start_time = ?, end_time = ?, note = ? WHERE id = ?"
      )
      .run(entry.date, entry.start_time, entry.end_time, entry.note, entry.id);
    this.db.prepare("DELETE FROM entry_tags WHERE entry_id = ?").run(entry.id);
    const insertLink = this.db.prepare("INSERT INTO entry_tags (entry_id, tag_id) VALUES (?, ?)");
    for (const tagId of tagIds) insertLink.run(entry.id, tagId);
  }

  async deleteEntry(id: string) {
    this.db.prepare("DELETE FROM entry_tags WHERE entry_id = ?").run(id);
    this.db.prepare("DELETE FROM entries WHERE id = ?").run(id);
  }
}

class PgDriver implements DbDriver {
  private pool: import("pg").Pool;
  private ready: Promise<void>;

  constructor(connectionString: string) {
    const { Pool } = require("pg");
    this.pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    this.ready = this.init();
  }

  private async init() {
    await this.migrateLegacy();
    for (const stmt of NEW_SCHEMA) await this.pool.query(stmt);
    await this.pool.query(ENTRIES_TABLE_NEW);
    await this.seedIfEmpty();
  }

  private async tableExists(name: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      "SELECT 1 FROM information_schema.tables WHERE table_name = $1",
      [name]
    );
    return rows.length > 0;
  }

  private async columnExists(table: string, column: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      "SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
      [table, column]
    );
    return rows.length > 0;
  }

  private async migrateLegacy() {
    if ((await this.tableExists("entries")) && (await this.columnExists("entries", "category_id"))) {
      await this.pool.query(`CREATE TABLE entries_new (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        note TEXT
      )`);
      await this.pool.query(
        "INSERT INTO entries_new (id, date, start_time, end_time, note) SELECT id, date, start_time, end_time, note FROM entries"
      );
      await this.pool.query(
        "CREATE TABLE IF NOT EXISTS entry_tags (entry_id TEXT NOT NULL, tag_id TEXT NOT NULL, PRIMARY KEY (entry_id, tag_id))"
      );
      await this.pool.query(
        "INSERT INTO entry_tags (entry_id, tag_id) SELECT id, category_id FROM entries WHERE category_id IS NOT NULL AND category_id != '' ON CONFLICT DO NOTHING"
      );
      await this.pool.query("DROP TABLE entries");
      await this.pool.query("ALTER TABLE entries_new RENAME TO entries");
    }

    if ((await this.tableExists("categories")) && !(await this.tableExists("tags"))) {
      await this.pool.query(
        "CREATE TABLE tags (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL)"
      );
      await this.pool.query("INSERT INTO tags (id, name, color) SELECT id, name, color FROM categories");
    }
  }

  private async seedIfEmpty() {
    const { rows: groupRows } = await this.pool.query("SELECT COUNT(*)::int as c FROM groups");
    if (groupRows[0].c === 0) {
      for (const g of DEFAULT_GROUPS) {
        await this.pool.query(
          "INSERT INTO groups (id, name, color, position) VALUES ($1, $2, $3, $4)",
          [g.id, g.name, g.color, g.position]
        );
      }
    }

    for (const { tag, groupIds } of buildSeedTags()) {
      const { rows } = await this.pool.query("SELECT 1 FROM tags WHERE id = $1", [tag.id]);
      if (rows.length > 0) continue;
      await this.pool.query("INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)", [
        tag.id,
        tag.name,
        tag.color,
      ]);
      for (const gid of groupIds) {
        await this.pool.query("INSERT INTO tag_groups (tag_id, group_id) VALUES ($1, $2)", [
          tag.id,
          gid,
        ]);
      }
    }
  }

  async getGroups(): Promise<Group[]> {
    await this.ready;
    const { rows } = await this.pool.query("SELECT * FROM groups ORDER BY position, name");
    return rows as Group[];
  }

  async createGroup(group: { id: string; name: string; color: string; position: number }) {
    await this.ready;
    await this.pool.query(
      "INSERT INTO groups (id, name, color, position) VALUES ($1, $2, $3, $4)",
      [group.id, group.name, group.color, group.position]
    );
  }

  async updateGroup(id: string, name: string, color: string) {
    await this.ready;
    await this.pool.query("UPDATE groups SET name = $1, color = $2 WHERE id = $3", [
      name,
      color,
      id,
    ]);
  }

  async deleteGroup(id: string) {
    await this.ready;
    await this.pool.query("DELETE FROM tag_groups WHERE group_id = $1", [id]);
    await this.pool.query("DELETE FROM groups WHERE id = $1", [id]);
  }

  async getTags(): Promise<Tag[]> {
    await this.ready;
    const { rows: tags } = await this.pool.query("SELECT * FROM tags ORDER BY name");
    const { rows: links } = await this.pool.query("SELECT tag_id, group_id FROM tag_groups");
    const byTag = new Map<string, string[]>();
    for (const link of links) {
      const list = byTag.get(link.tag_id) || [];
      list.push(link.group_id);
      byTag.set(link.tag_id, list);
    }
    return tags.map((t: Omit<Tag, "group_ids">) => ({ ...t, group_ids: byTag.get(t.id) || [] }));
  }

  async createTag(tag: { id: string; name: string; color: string }, groupIds: string[]) {
    await this.ready;
    await this.pool.query("INSERT INTO tags (id, name, color) VALUES ($1, $2, $3)", [
      tag.id,
      tag.name,
      tag.color,
    ]);
    for (const gid of groupIds) {
      await this.pool.query("INSERT INTO tag_groups (tag_id, group_id) VALUES ($1, $2)", [
        tag.id,
        gid,
      ]);
    }
  }

  async updateTag(id: string, name: string, color: string, groupIds: string[]) {
    await this.ready;
    await this.pool.query("UPDATE tags SET name = $1, color = $2 WHERE id = $3", [
      name,
      color,
      id,
    ]);
    await this.pool.query("DELETE FROM tag_groups WHERE tag_id = $1", [id]);
    for (const gid of groupIds) {
      await this.pool.query("INSERT INTO tag_groups (tag_id, group_id) VALUES ($1, $2)", [
        id,
        gid,
      ]);
    }
  }

  async deleteTag(id: string) {
    await this.ready;
    await this.pool.query("DELETE FROM tag_groups WHERE tag_id = $1", [id]);
    await this.pool.query("DELETE FROM entry_tags WHERE tag_id = $1", [id]);
    await this.pool.query("DELETE FROM tags WHERE id = $1", [id]);
  }

  async getEntries(startDate: string, endDate: string): Promise<Entry[]> {
    await this.ready;
    const { rows: entries } = await this.pool.query(
      "SELECT * FROM entries WHERE date >= $1 AND date <= $2 ORDER BY date, start_time",
      [startDate, endDate]
    );
    if (entries.length === 0) return [];
    const ids = entries.map((e: { id: string }) => e.id);
    const { rows: links } = await this.pool.query(
      "SELECT entry_id, tag_id FROM entry_tags WHERE entry_id = ANY($1)",
      [ids]
    );
    const byEntry = new Map<string, string[]>();
    for (const link of links) {
      const list = byEntry.get(link.entry_id) || [];
      list.push(link.tag_id);
      byEntry.set(link.entry_id, list);
    }
    return entries.map((e: Omit<Entry, "tag_ids">) => ({ ...e, tag_ids: byEntry.get(e.id) || [] }));
  }

  async createEntry(entry: Omit<Entry, "tag_ids">, tagIds: string[]) {
    await this.ready;
    await this.pool.query(
      "INSERT INTO entries (id, date, start_time, end_time, note) VALUES ($1, $2, $3, $4, $5)",
      [entry.id, entry.date, entry.start_time, entry.end_time, entry.note]
    );
    for (const tagId of tagIds) {
      await this.pool.query("INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2)", [
        entry.id,
        tagId,
      ]);
    }
  }

  async updateEntry(entry: Omit<Entry, "tag_ids">, tagIds: string[]) {
    await this.ready;
    await this.pool.query(
      "UPDATE entries SET date = $1, start_time = $2, end_time = $3, note = $4 WHERE id = $5",
      [entry.date, entry.start_time, entry.end_time, entry.note, entry.id]
    );
    await this.pool.query("DELETE FROM entry_tags WHERE entry_id = $1", [entry.id]);
    for (const tagId of tagIds) {
      await this.pool.query("INSERT INTO entry_tags (entry_id, tag_id) VALUES ($1, $2)", [
        entry.id,
        tagId,
      ]);
    }
  }

  async deleteEntry(id: string) {
    await this.ready;
    await this.pool.query("DELETE FROM entry_tags WHERE entry_id = $1", [id]);
    await this.pool.query("DELETE FROM entries WHERE id = $1", [id]);
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __dbDriver: DbDriver | undefined;
}

function createDriver(): DbDriver {
  const url =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (url && url.startsWith("postgres")) {
    return new PgDriver(url);
  }
  return new SqliteDriver();
}

export function getDb(): DbDriver {
  if (!global.__dbDriver) {
    global.__dbDriver = createDriver();
  }
  return global.__dbDriver;
}
