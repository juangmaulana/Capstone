import { Kysely, sql } from 'kysely';
import { Database } from '../db/types';

const SCIENTIFIC_NAME_AUTHORS = [
  'Vachellia nilotica (L.) P.J.H.Hurter & Mabb.',
  'Lantana camara L.',
  'Merremia hederacea (Burm.f.) Hallier f.',
  'Clitoria ternatea L.',
  'Ageratum conyzoides L.',
] as const;

const getBinomialName = (scientificName: string) =>
  scientificName.trim().split(/\s+/).slice(0, 2).join(' ');

export async function up(db: Kysely<Database>) {
  await db.schema
    .createTable('roles')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('description', 'text', (col) => col.notNull().defaultTo(''))
    .execute()

  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('role_id', 'integer', (col) => col.notNull().references('roles.id').onDelete('restrict'))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('password_hash', 'varchar(255)', (col) => col.notNull())
    .addColumn('last_login_at', 'timestamp')
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute();

  await db.schema
    .createTable('plants')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('common_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('scientific_name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('kingdom', 'varchar(255)', (col) => col.notNull())
    .addColumn('phylum', 'varchar(255)', (col) => col.notNull())
    .addColumn('class', 'varchar(255)', (col) => col.notNull())
    .addColumn('order', 'varchar(255)', (col) => col.notNull())
    .addColumn('family', 'varchar(255)', (col) => col.notNull())
    .addColumn('genus', 'varchar(255)', (col) => col.notNull())
    .addColumn('species', 'varchar(255)', (col) => col.notNull())
    .addColumn('botanical_description', 'text', (col) => col.notNull())
    .addColumn('ecological_information', 'text', (col) => col.notNull())
    .addColumn('environmental_impact', 'text', (col) => col.notNull())
    .addColumn('source_references', 'text', (col) => col.notNull())
    .addColumn('image_path', 'text', (col) => col.notNull())
    .addColumn('image_reference', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createTable('images')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('file_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('file_path', 'text', (col) => col.notNull())
    .addColumn('file_size', 'integer', (col) => col.notNull())
    .addColumn('latitude', 'double precision', (col) => col.notNull())
    .addColumn('longitude', 'double precision', (col) => col.notNull())
    .addColumn('elevation', 'double precision', (col) => col.notNull())
    .addColumn('uploaded_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createTable('identifications')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('plant_id', 'integer', (col) => col.references('plants.id').onDelete('set null'))
    .addColumn('image_id', 'integer', (col) => col.references('images.id').onDelete('set null'))
    .addColumn('confidence', 'double precision', (col) => col.notNull())
    .addColumn('ai_response', 'text')
    .addColumn('identified_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('is_success', 'boolean', (col) => col.defaultTo(true))
    .addColumn('ranger_id', 'integer', (col) => col.references('users.id').onDelete('set null'))
    .addColumn('uploaded_by', 'integer', (col) => col.references('users.id').onDelete('set null'))
    .execute()

  await db.schema
    .createTable('audit_logs')
    .addColumn('id', 'uuid', (col) => col.primaryKey())
    .addColumn('actor_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('entity_id', 'varchar(255)', (col) => col.notNull())
    .addColumn('entity_type', 'varchar(255)', (col) => col.notNull())
    .addColumn('action', 'varchar(255)', (col) => col.notNull())
    .addColumn('message', 'varchar(255)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createIndex('users_role_id_idx')
    .on('users')
    .column('role_id')
    .execute()

  await db.schema
    .createIndex('users_email_idx')
    .on('users')
    .column('email')
    .execute()

  await db.schema
    .createIndex('identifications_plant_id_idx')
    .on('identifications')
    .column('plant_id')
    .execute()
  
  await db.schema
    .createIndex('identifications_image_id_idx')
    .on('identifications')
    .column('image_id')
    .execute()

  await db.schema
    .createIndex('audit_logs_action_idx')
    .on('audit_logs')
    .column('action')
    .execute()

  await sql`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `.execute(db)

  await sql`
    CREATE TRIGGER users_updated_at_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    `.execute(db)

  await sql`
    CREATE TRIGGER plants_updated_at_trigger
    BEFORE UPDATE ON plants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
    `.execute(db)

  for (const scientificName of SCIENTIFIC_NAME_AUTHORS) {
    await db
      .updateTable('plants')
      .set({ scientific_name: scientificName })
      .where('scientific_name', '=', getBinomialName(scientificName))
      .execute()
  }
}

export async function down(db: Kysely<Database>) {
  await sql`DROP TRIGGER IF EXISTS users_updated_at_trigger ON users`.execute(db)
  await sql`DROP TRIGGER IF EXISTS plants_updated_at_trigger ON plants`.execute(db)

  await sql`DROP FUNCTION IF EXISTS update_updated_at_column`.execute(db)

  await db.schema.dropTable('identifications').execute()
  await db.schema.dropTable('images').execute()
  await db.schema.dropTable('plants').execute()
  await db.schema.dropTable('users').execute()
  await db.schema.dropTable('roles').execute()
  await db.schema.dropTable('audit_logs').execute()
}
