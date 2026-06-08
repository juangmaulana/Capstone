import { Kysely, sql } from 'kysely';
import { Database } from '../db/types';

export async function up(db: Kysely<Database>) {
  await db.schema
    .createTable('password_reset_codes')
    .ifNotExists()
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('email', 'varchar(255)', (col) => col.notNull())
    .addColumn('code_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('reset_token_hash', 'varchar(255)')
    .addColumn('expires_at', 'timestamp', (col) => col.notNull())
    .addColumn('used_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createIndex('password_reset_codes_email_idx')
    .ifNotExists()
    .on('password_reset_codes')
    .column('email')
    .execute();

  await db.schema
    .createIndex('password_reset_codes_reset_token_hash_idx')
    .ifNotExists()
    .on('password_reset_codes')
    .column('reset_token_hash')
    .execute();
}

export async function down(db: Kysely<Database>) {
  await db.schema.dropTable('password_reset_codes').ifExists().execute();
}
