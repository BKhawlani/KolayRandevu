import Database from 'better-sqlite3'
import { mkdirSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'

mkdirSync(path.dirname(config.databasePath), { recursive: true })

export const database = new Database(config.databasePath)
database.pragma('journal_mode = WAL')
database.pragma('foreign_keys = ON')

database.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`)

const migrationDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../migrations')
const migrations = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort()

const hasMigration = database.prepare(
  'SELECT 1 FROM schema_migrations WHERE name = ?',
)
const recordMigration = database.prepare(
  'INSERT INTO schema_migrations (name) VALUES (?)',
)

for (const name of migrations) {
  if (hasMigration.get(name)) continue

  const sql = readFileSync(path.join(migrationDirectory, name), 'utf8')
  database.transaction(() => {
    database.exec(sql)
    recordMigration.run(name)
  }).immediate()
}
