import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'news.db');
export const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      description  TEXT,
      content      TEXT,
      url          TEXT NOT NULL UNIQUE,
      image_url    TEXT,
      source       TEXT NOT NULL,
      source_logo  TEXT,
      category     TEXT,
      published_at TEXT,
      scraped_at   TEXT NOT NULL,
      is_active    INTEGER DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_source     ON articles(source);
    CREATE INDEX IF NOT EXISTS idx_category   ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_scraped_at ON articles(scraped_at DESC);
  `);
  console.log('[DB] Banco de dados inicializado.');
}