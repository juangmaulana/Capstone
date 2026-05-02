import { Database } from "./types";
import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";

export function createDb(connectionString: string) {
  const pool = new Pool({ 
    connectionString,
  })

  return new Kysely<Database>({
    dialect: new PostgresDialect({ pool }),
  })
}