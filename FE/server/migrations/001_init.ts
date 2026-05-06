import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>) {
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
    .addColumn('image_path', 'text', (col) => col.notNull())
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
}

export async function down(db: Kysely<any>) {
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