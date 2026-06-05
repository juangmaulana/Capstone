import { Database } from "./types";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

export function createDb(connectionString: string) {
  const pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX) || 10,
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS) || 30000,
    connectionTimeoutMillis: Number(process.env.DB_POOL_CONNECTION_TIMEOUT_MS) || 2000,
  })

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
    log: ['error'],
  })
}