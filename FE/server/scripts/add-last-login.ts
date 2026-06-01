import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import 'dotenv/config'
import { Database } from '../db/types'

type DatabaseError = {
  code?: string
}

const isDatabaseError = (err: unknown): err is DatabaseError => {
  return typeof err === 'object' && err !== null && 'code' in err
}

async function addLastLoginColumn() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  })

  console.log('Adding last_login_at column to users table...')

  try {
    await db.schema
      .alterTable('users')
      .addColumn('last_login_at', 'timestamp')
      .execute()
    console.log('Column last_login_at added successfully')
  } catch (err: unknown) {
    if (isDatabaseError(err) && err.code === '42701') {
      console.log('Column last_login_at already exists, skipping')
    } else {
      console.error('Failed to add column:', err)
    }
  }

  await db.destroy()
}

addLastLoginColumn().catch(console.error)
