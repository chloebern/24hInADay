import path from "node:path";

export type Category = {
  id: string;
  name: string;
  color: string;
};

export type Entry = {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  category_id: string;
  note: string | null;
};

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    category_id TEXT NOT NULL,
    note TEXT
  )`,
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-work", name: "Work", color: "#2a78d6" },
  { id: "cat-break", name: "Break", color: "#008300" },
  { id: "cat-meetings", name: "Meetings", color: "#e87ba4" },
  { id: "cat-admin", name: "Admin / emails", color: "#eda100" },
  { id: "cat-cleanroom", name: "Clean room", color: "#1baf7a" },
];

interface DbDriver {
  getCategories(): Promise<Category[]>;
  createCategory(cat: Category): Promise<void>;
  updateCategory(id: string, name: string, color: string): Promise<void>;
  deleteCategory(id: string): Promise<void>;
  getEntries(startDate: string, endDate: string): Promise<Entry[]>;
  createEntry(entry: Entry): Promise<void>;
  updateEntry(entry: Entry): Promise<void>;
  deleteEntry(id: string): Promise<void>;
}

class SqliteDriver implements DbDriver {
  private db: import("better-sqlite3").Database;

  constructor() {
    const Database = require("better-sqlite3");
    const file = path.join(process.cwd(), "data.db");
    this.db = new Database(file);
    this.db.pragma("journal_mode = WAL");
    for (const stmt of SCHEMA) this.db.exec(stmt);
    const count = this.db
      .prepare("SELECT COUNT(*) as c FROM categories")
      .get() as { c: number };
    if (count.c === 0) {
      const insert = this.db.prepare(
        "INSERT INTO categories (id, name, color) VALUES (?, ?, ?)"
      );
      for (const cat of DEFAULT_CATEGORIES) {
        insert.run(cat.id, cat.name, cat.color);
      }
    }
  }

  async getCategories() {
    return this.db
      .prepare("SELECT * FROM categories ORDER BY name")
      .all() as Category[];
  }

  async createCategory(cat: Category) {
    this.db
      .prepare("INSERT INTO categories (id, name, color) VALUES (?, ?, ?)")
      .run(cat.id, cat.name, cat.color);
  }

  async updateCategory(id: string, name: string, color: string) {
    this.db
      .prepare("UPDATE categories SET name = ?, color = ? WHERE id = ?")
      .run(name, color, id);
  }

  async deleteCategory(id: string) {
    this.db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  }

  async getEntries(startDate: string, endDate: string) {
    return this.db
      .prepare(
        "SELECT * FROM entries WHERE date >= ? AND date <= ? ORDER BY date, start_time"
      )
      .all(startDate, endDate) as Entry[];
  }

  async createEntry(entry: Entry) {
    this.db
      .prepare(
        "INSERT INTO entries (id, date, start_time, end_time, category_id, note) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(
        entry.id,
        entry.date,
        entry.start_time,
        entry.end_time,
        entry.category_id,
        entry.note
      );
  }

  async updateEntry(entry: Entry) {
    this.db
      .prepare(
        "UPDATE entries SET date = ?, start_time = ?, end_time = ?, category_id = ?, note = ? WHERE id = ?"
      )
      .run(
        entry.date,
        entry.start_time,
        entry.end_time,
        entry.category_id,
        entry.note,
        entry.id
      );
  }

  async deleteEntry(id: string) {
    this.db.prepare("DELETE FROM entries WHERE id = ?").run(id);
  }
}

class PgDriver implements DbDriver {
  private pool: import("pg").Pool;
  private ready: Promise<void>;

  constructor(connectionString: string) {
    const { Pool } = require("pg");
    this.pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    this.ready = this.init();
  }

  private async init() {
    for (const stmt of SCHEMA) await this.pool.query(stmt);
    const { rows } = await this.pool.query(
      "SELECT COUNT(*)::int as c FROM categories"
    );
    if (rows[0].c === 0) {
      for (const cat of DEFAULT_CATEGORIES) {
        await this.pool.query(
          "INSERT INTO categories (id, name, color) VALUES ($1, $2, $3)",
          [cat.id, cat.name, cat.color]
        );
      }
    }
  }

  async getCategories() {
    await this.ready;
    const { rows } = await this.pool.query(
      "SELECT * FROM categories ORDER BY name"
    );
    return rows as Category[];
  }

  async createCategory(cat: Category) {
    await this.ready;
    await this.pool.query(
      "INSERT INTO categories (id, name, color) VALUES ($1, $2, $3)",
      [cat.id, cat.name, cat.color]
    );
  }

  async updateCategory(id: string, name: string, color: string) {
    await this.ready;
    await this.pool.query(
      "UPDATE categories SET name = $1, color = $2 WHERE id = $3",
      [name, color, id]
    );
  }

  async deleteCategory(id: string) {
    await this.ready;
    await this.pool.query("DELETE FROM categories WHERE id = $1", [id]);
  }

  async getEntries(startDate: string, endDate: string) {
    await this.ready;
    const { rows } = await this.pool.query(
      "SELECT * FROM entries WHERE date >= $1 AND date <= $2 ORDER BY date, start_time",
      [startDate, endDate]
    );
    return rows as Entry[];
  }

  async createEntry(entry: Entry) {
    await this.ready;
    await this.pool.query(
      "INSERT INTO entries (id, date, start_time, end_time, category_id, note) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        entry.id,
        entry.date,
        entry.start_time,
        entry.end_time,
        entry.category_id,
        entry.note,
      ]
    );
  }

  async updateEntry(entry: Entry) {
    await this.ready;
    await this.pool.query(
      "UPDATE entries SET date = $1, start_time = $2, end_time = $3, category_id = $4, note = $5 WHERE id = $6",
      [
        entry.date,
        entry.start_time,
        entry.end_time,
        entry.category_id,
        entry.note,
        entry.id,
      ]
    );
  }

  async deleteEntry(id: string) {
    await this.ready;
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
