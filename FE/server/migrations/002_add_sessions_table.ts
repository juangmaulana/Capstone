import { Kysely, sql } from 'kysely';
import { Database } from '../db/types';

export async function up(db: Kysely<Database>) {
  await db.schema
    .createTable('sessions')
    .addColumn('id', 'varchar(255)', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`)
    )
    .execute()
}

export async function down(db: Kysely<Database>) {
  await db.schema.dropTable('sessions').execute()
}
