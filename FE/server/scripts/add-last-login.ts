import { Kysely, PostgresDialect, sql } from 'kysely'
import { Pool } from 'pg'
import 'dotenv/config'

async function addLastLoginColumn() {
  const db = new Kysely<any>({
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
      .addColumn('last_l  ogin_at', 'timestamp')
      .execute()
    console.log('Column last_login_at added successfully')
  } catch (err: any) {
    if (err.code === '42701') {
      console.log('Column last_login_at already exists, skipping')
    } else {
      console.error('Failed to add column:', err)
    }
  }

  await db.destroy()
}

addLastLoginColumn().catch(console.error)
