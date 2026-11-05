import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import * as schema from "./schema";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const migrationsFolder = resolve(process.cwd(), "drizzle");

export function dataDir() {
  return process.env.DATA_DIR || join(homedir(), ".adot-dev");
}

export async function createPgliteDb(path?: string): Promise<Db> {
  if (path) mkdirSync(path, { recursive: true });
  const db = drizzlePglite(new PGlite(path), { schema });
  await migratePglite(db, { migrationsFolder });
  return db as unknown as Db;
}

async function connect(): Promise<Db> {
  if (!process.env.DATABASE_URL) return createPgliteDb(join(dataDir(), "pg"));
  const db = drizzlePg(new Pool({ connectionString: process.env.DATABASE_URL }), { schema });
  await migratePg(db, { migrationsFolder });
  return db as unknown as Db;
}

// Kept on globalThis so dev reloads reuse the one connection PGlite allows.
const store = globalThis as unknown as { adotDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  store.adotDb ??= connect();
  return store.adotDb;
}
