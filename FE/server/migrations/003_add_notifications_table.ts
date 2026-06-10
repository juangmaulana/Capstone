import { Kysely, sql } from 'kysely';
import { Database } from '../db/types';

export async function up(db: Kysely<Database>) {
  await db.schema
    .createTable('notifications')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('user_id', 'integer', (col) => col.notNull().references('users.id').onDelete('cascade'))
    .addColumn('recipient_role', 'varchar(255)', (col) => col.notNull())
    .addColumn('actor_id', 'integer', (col) => col.notNull())
    .addColumn('actor_username', 'varchar(255)', (col) => col.notNull())
    .addColumn('actor_role', 'varchar(255)', (col) => col.notNull())
    .addColumn('action', 'varchar(255)', (col) => col.notNull())
    .addColumn('entity_type', 'varchar(255)', (col) => col.notNull())
    .addColumn('entity_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('message', 'varchar(255)', (col) => col.notNull())
    .addColumn('metadata', 'varchar(255)', (col) => col.notNull())
    .addColumn('is_read', 'boolean', (col) => col.defaultTo(false))
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createIndex('notification_user_idx')
    .on('notifications')
    .column('user_id')
    .execute()
}

export async function down(db: Kysely<Database>) {
  await db.schema.dropTable('notifications').execute()
}
