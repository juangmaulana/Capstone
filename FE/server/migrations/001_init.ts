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
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createTable('users')
    .addColumn('id', 'serial', col => col.primaryKey())
    .addColumn('role_id', 'integer', (col) =>
      col.notNull().references('roles.id').onDelete('restrict'))
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('email', 'varchar(255)', (col) =>
      col.notNull().unique())
    .addColumn('password', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => 
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('last_login_at', 'timestamp')
    .execute();

    await db.schema
    .createTable('plants')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('common_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('scientific_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('family', 'varchar(255)', (col) => col.notNull())
    .addColumn('genus', 'varchar(255)', (col) => col.notNull())
    .addColumn('botanical_description', 'text', (col) => col.notNull())
    .addColumn('ecological_information', 'text', (col) => col.notNull())
    .addColumn('environmental_impact', 'text', (col) => col.notNull())
    .addColumn('botanical_description_en', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('botanical_description_id', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('ecological_information_en', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('ecological_information_id', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('environmental_impact_en', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('environmental_impact_id', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('image_path', 'text', (col) => col.notNull())
    .addColumn('kingdom', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('phylum', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('tax_class', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('order_rank', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('tax_species', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('source', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('created_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .addColumn('updated_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

    await db.schema
    .createTable('images')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('file_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('file_path', 'text', (col) => col.notNull())
    .addColumn('file_size', 'integer', (col) => col.notNull())
    .addColumn('latitude', 'double precision', (col) => col.notNull())
    .addColumn('longitude', 'double precision', (col) => col.notNull())
    .addColumn('uploaded_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

  await db.schema
    .createTable('identifications')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('plant_id', 'integer', (col) =>
      col.notNull().references('plants.id').onDelete('cascade'))
    .addColumn('image_id', 'integer', (col) =>
      col.notNull().references('images.id').onDelete('cascade'))
    .addColumn('confidence', 'double precision', (col) => col.notNull())
    .addColumn('ai_response', 'text', (col) => col.notNull())
    .addColumn('is_success', 'boolean', (col) => col.notNull())
    .addColumn('identified_at', 'timestamp', (col) =>
      col.notNull().defaultTo(sql`CURRENT_TIMESTAMP`))
    .execute()

    await db.schema
      .createIndex('users_role_id_idx')
      .on('users')
      .column('role_id')
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
      CREATE TRIGGER roles_updated_at_trigger
      BEFORE UPDATE ON roles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
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
  await sql`DROP TRIGGER IF EXISTS roles_updated_at_trigger ON roles`.execute(db)
  await sql`DROP TRIGGER IF EXISTS users_updated_at_trigger ON users`.execute(db)
  await sql`DROP TRIGGER IF EXISTS plants_updated_at_trigger ON plants`.execute(db)

  await sql`DROP FUNCTION IF EXISTS update_updated_at_column`.execute(db)

  await db.schema.dropTable('identifications').execute()
  await db.schema.dropTable('images').execute()
  await db.schema.dropTable('plants').execute()
  await db.schema.dropTable('users').execute()
  await db.schema.dropTable('roles').execute()
}
