import { Kysely, PostgresDialect, sql } from 'kysely'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { getScientificNameWithAuthor } from '../../lib/plant/scientific-name-author'
import { Database, PlantInsert } from '../db/types'

const requiredEnv = (key: string) => {
  const value = process.env[key]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

const CANONICAL_ADMIN_EMAIL = requiredEnv('FALLBACK_ADMIN_EMAIL')
const CANONICAL_ADMIN_PASSWORD = requiredEnv('FALLBACK_ADMIN_PASSWORD')
const CANONICAL_ADMIN_NAME = requiredEnv('FALLBACK_ADMIN_NAME')
const LEGACY_ADMIN_EMAIL = process.env.LEGACY_ADMIN_EMAIL?.trim()

async function columnExists(db: Kysely<Database>, tableName: string, columnName: string) {
  const result = await sql<{ column_name: string }>`
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = ${tableName}
      and column_name = ${columnName}
    limit 1
  `.execute(db)

  return result.rows.length > 0
}

async function ensureAuditLogsTable(db: Kysely<Database>) {
  await sql`
    create table if not exists audit_logs (
      id uuid primary key,
      actor_id varchar(255) not null,
      entity_id varchar(255) not null,
      entity_type varchar(255) not null,
      action varchar(255) not null,
      message varchar(255) not null,
      created_at timestamp not null default CURRENT_TIMESTAMP
    )
  `.execute(db)
}

async function renameColumnIfNeeded(
  db: Kysely<Database>,
  tableName: string,
  oldColumnName: string,
  newColumnName: string
) {
  const hasOldColumn = await columnExists(db, tableName, oldColumnName)
  const hasNewColumn = await columnExists(db, tableName, newColumnName)

  if (hasOldColumn && !hasNewColumn) {
    await db.schema.alterTable(tableName).renameColumn(oldColumnName, newColumnName).execute()
    console.log(`Renamed ${tableName}.${oldColumnName} to ${newColumnName}`)
  }
}

async function ensureColumn(
  db: Kysely<Database>,
  tableName: string,
  columnName: string,
  columnType: 'boolean' | 'text' | 'varchar(255)'
) {
  if (await columnExists(db, tableName, columnName)) return

  const builder = db.schema.alterTable(tableName)
  if (columnType === 'boolean') {
    await builder.addColumn(columnName, 'boolean', (col) => col.notNull().defaultTo(true)).execute()
  } else {
    await builder.addColumn(columnName, columnType, (col) => col.notNull().defaultTo('')).execute()
  }
  console.log(`Added ${tableName}.${columnName}`)
}

async function alignSchema(db: Kysely<Database>) {
  await ensureAuditLogsTable(db)
  await renameColumnIfNeeded(db, 'users', 'password', 'password_hash')
  await renameColumnIfNeeded(db, 'plants', 'tax_class', 'class')
  await renameColumnIfNeeded(db, 'plants', 'order_rank', 'order')
  await renameColumnIfNeeded(db, 'plants', 'tax_species', 'species')
  await renameColumnIfNeeded(db, 'plants', 'source', 'source_reference')
  await renameColumnIfNeeded(db, 'plants', 'image_source', 'image_reference')

  await ensureColumn(db, 'plants', 'kingdom', 'varchar(255)')
  await ensureColumn(db, 'plants', 'phylum', 'varchar(255)')
  await ensureColumn(db, 'plants', 'class', 'varchar(255)')
  await ensureColumn(db, 'plants', 'order', 'varchar(255)')
  await ensureColumn(db, 'plants', 'species', 'varchar(255)')
  await ensureColumn(db, 'plants', 'source_reference', 'text')
  await ensureColumn(db, 'plants', 'image_reference', 'text')
  await ensureColumn(db, 'plants', 'is_detectable', 'boolean')
}

const sourceText = {
  vachelliaNilotica: [
    'https://www.gbif.org/species/3974744',
    'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77089275-1',
    'https://en.wikipedia.org/wiki/Vachellia_nilotica',
  ].join('\n'),
  lantanaCamara: [
    'https://www.gbif.org/species/2925303',
    'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:325686-2',
    'https://en.wikipedia.org/wiki/Lantana_camara',
  ].join('\n'),
  merremiaHederacea: [
    'https://www.gbif.org/species/5341744',
    'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:270531-1',
    'https://en.wikipedia.org/wiki/Merremia_hederacea',
  ].join('\n'),
  clitoriaTernatea: [
    'https://www.gbif.org/species/2946519',
    'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:486606-1',
    'https://en.wikipedia.org/wiki/Clitoria_ternatea',
  ].join('\n'),
  ageratumConyzoides: [
    'https://www.gbif.org/species/5401673',
    'https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:7086-2',
    'https://en.wikipedia.org/wiki/Ageratum_conyzoides',
  ].join('\n'),
}

const imageReferenceText = {
  vachelliaNilotica: 'https://www.fao.org/4/q2934e/q2934e04.htm',
  lantanaCamara: 'https://indiaflora-ces.iisc.ac.in/FloraPeninsular/herbsheet.php?id=9534&cat=7',
  merremiaHederacea: 'https://indiaflora-ces.iisc.ac.in/FloraPeninsular/herbsheet.php?id=2896&cat=7',
  clitoriaTernatea: 'https://indiaflora-ces.iisc.ac.in/FloraKarnataka/herbsheet.php?id=1908&cat=1',
  ageratumConyzoides: 'https://www.researchgate.net/figure/Figura-2-a-c-Ageratum-conyzoides-a-habito-b-capitulo-c-flor-Teles-et-al-575-d_fig1_283232634',
}

const seedPlants: PlantInsert[] = [
  {
    common_name: 'Babul',
    scientific_name: getScientificNameWithAuthor('Vachellia nilotica'),
    family: 'Fabaceae',
    genus: 'Vachellia',
    botanical_description: 'Vachellia nilotica adalah pohon berduri invasif dengan daun majemuk menyirip ganda. Tinggi mencapai 5-20 m, memiliki bunga kuning bulat dan polong coklat kehitaman. Kulit kayu berwarna abu-abu kehitaman dan berduri panjang.',
    ecological_information: 'Gulma berkayu invasif di Taman Nasional Baluran yang awalnya diperkenalkan sebagai sekat bakar. Menyebar agresif di sabana Bekol, membentuk semak belukar padat yang menekan pertumbuhan rumput asli penting bagi Banteng Jawa.',
    environmental_impact: 'Mengubah ekosistem sabana menjadi semak belukar, mengurangi area penggembalaan bagi herbivora lokal, mengganggu siklus kebakaran alami, dan menekan keanekaragaman hayati asli.',
    image_path: '/sketsa-herbarium-acacia-nilotica.gif',
    kingdom: 'Plantae',
    phylum: 'Tracheophyta',
    class: 'Magnoliopsida',
    order: 'Fabales',
    species: 'V. nilotica',
    source_reference: sourceText.vachelliaNilotica,
    image_reference: imageReferenceText.vachelliaNilotica,
    is_detectable: true,
  },
  {
    common_name: 'Tembelekan',
    scientific_name: getScientificNameWithAuthor('Lantana camara'),
    family: 'Verbenaceae',
    genus: 'Lantana',
    botanical_description: 'Semak tegak bercabang dengan batang berkayu berduri kecil. Daun berhadapan, berkerut, berbulu kasar. Bunga majemuk berwarna-warni (kuning, oranye, merah, merah muda) dalam payung datar.',
    ecological_information: 'Spesies asing sangat invasif di daerah tropis dan subtropis. Membentuk semak belukar padat dan tak tertembus yang mengalahkan flora asli, mengubah rezim kebakaran, dan mengurangi lahan penggembalaan satwa liar.',
    environmental_impact: 'Sangat invasif, meracuni ternak, menekan pertumbuhan tanaman asli melalui alelopati, dan meningkatkan intensitas kebakaran hutan.',
    image_path: '/sketsa-herbarium-lantana-camara.jpg',
    kingdom: 'Plantae',
    phylum: 'Tracheophyta',
    class: 'Magnoliopsida',
    order: 'Lamiales',
    species: 'L. camara',
    source_reference: sourceText.lantanaCamara,
    image_reference: imageReferenceText.lantanaCamara,
    is_detectable: true,
  },
  {
    common_name: 'Kangkung Pagar',
    scientific_name: getScientificNameWithAuthor('Merremia hederacea'),
    family: 'Convolvulaceae',
    genus: 'Merremia',
    botanical_description: 'Tanaman merambat herba tahunan dari keluarga Convolvulaceae. Daun berbentuk jantung hingga berlekuk 3-5 jari, tipis, dan berwarna hijau cerah. Bunga berbentuk corong berwarna kuning pucat hingga putih. Buah kapsul membulat berisi biji kecil.',
    ecological_information: 'Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.',
    environmental_impact: 'Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.',
    image_path: '/sketsa-herbarium-merremia-hederacea.jpg',
    kingdom: 'Plantae',
    phylum: 'Tracheophyta',
    class: 'Magnoliopsida',
    order: 'Solanales',
    species: 'M. hederacea',
    source_reference: sourceText.merremiaHederacea,
    image_reference: imageReferenceText.merremiaHederacea,
    is_detectable: true,
  },
  {
    common_name: 'Telang',
    scientific_name: getScientificNameWithAuthor('Clitoria ternatea'),
    family: 'Fabaceae',
    genus: 'Clitoria',
    botanical_description: 'Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.',
    ecological_information: 'Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.',
    environmental_impact: 'Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.',
    image_path: '/sketsa-herbarium-clitoria-ternatea.jpg',
    kingdom: 'Plantae',
    phylum: 'Tracheophyta',
    class: 'Magnoliopsida',
    order: 'Fabales',
    species: 'C. ternatea',
    source_reference: sourceText.clitoriaTernatea,
    image_reference: imageReferenceText.clitoriaTernatea,
    is_detectable: true,
  },
  {
    common_name: 'Bandotan',
    scientific_name: getScientificNameWithAuthor('Ageratum conyzoides'),
    family: 'Asteraceae',
    genus: 'Ageratum',
    botanical_description: 'Gulma herba tahunan setinggi 30-80 cm. Daun berhadapan berbentuk oval dengan tepi bergerigi. Bunga biru-ungu pucat atau putih dalam payung terminal. Batang berbulu halus.',
    ecological_information: 'Terkenal karena produksi bijinya yang tinggi dan kemampuan beradaptasi. Menyerang lahan terganggu, ladang pertanian, dan ekosistem alami. Menghasilkan bahan kimia alelopati.',
    environmental_impact: 'Menghambat pertumbuhan tanaman asli melalui alelopati, bersifat racun bagi hewan pemakan rumput, dan menjadi gulma persisten di lahan pertanian.',
    image_path: '/sketsa-herbarium-Ageratum-conyzoides.webp',
    kingdom: 'Plantae',
    phylum: 'Tracheophyta',
    class: 'Magnoliopsida',
    order: 'Asterales',
    species: 'A. conyzoides',
    source_reference: sourceText.ageratumConyzoides,
    image_reference: imageReferenceText.ageratumConyzoides,
    is_detectable: true,
  },
]

async function seed() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  })

  console.log('Seeding database...')
  await alignSchema(db)

  const existingRoles = await db.selectFrom('roles').selectAll().execute()
  if (existingRoles.length === 0) {
    await db.insertInto('roles').values([
      { name: 'Super Admin', description: 'Full system access' },
      { name: 'Admin', description: 'Administrative access' },
      { name: 'Researcher', description: 'Research and data access' },
      { name: 'Ranger', description: 'Field data collection and monitoring' },
    ]).execute()
    console.log('Roles seeded')
  } else {
    console.log('Roles already exist, skipping')
  }

  const adminRole = await db
    .selectFrom('roles')
    .selectAll()
    .where('name', '=', 'Super Admin')
    .executeTakeFirst()

  if (adminRole) {
    const canonicalAdmin = await db
      .selectFrom('users')
      .select(['id'])
      .where('email', '=', CANONICAL_ADMIN_EMAIL)
      .executeTakeFirst()
    const legacyAdmin = LEGACY_ADMIN_EMAIL
      ? await db.selectFrom('users').select(['id']).where('email', '=', LEGACY_ADMIN_EMAIL).executeTakeFirst()
      : null
    const passwordHash = await bcrypt.hash(CANONICAL_ADMIN_PASSWORD, 10)

    if (canonicalAdmin) {
      await db
        .updateTable('users')
        .set({
          role_id: adminRole.id,
          name: CANONICAL_ADMIN_NAME,
          password_hash: passwordHash,
        })
        .where('id', '=', canonicalAdmin.id)
        .execute()

      if (legacyAdmin && legacyAdmin.id !== canonicalAdmin.id) {
        await db.deleteFrom('users').where('id', '=', legacyAdmin.id).execute()
        console.log(`Legacy admin removed (email: ${LEGACY_ADMIN_EMAIL})`)
      }
      console.log(`Admin user already exists (email: ${CANONICAL_ADMIN_EMAIL})`)
    } else if (legacyAdmin) {
      await db
        .updateTable('users')
        .set({
          role_id: adminRole.id,
          name: CANONICAL_ADMIN_NAME,
          email: CANONICAL_ADMIN_EMAIL,
          password_hash: passwordHash,
        })
        .where('id', '=', legacyAdmin.id)
        .execute()
      console.log(`Legacy admin migrated to ${CANONICAL_ADMIN_EMAIL}`)
    } else {
      await db.insertInto('users').values({
        role_id: adminRole.id,
        name: CANONICAL_ADMIN_NAME,
        email: CANONICAL_ADMIN_EMAIL,
        password_hash: passwordHash,
      }).execute()
      console.log(`Admin user seeded (email: ${CANONICAL_ADMIN_EMAIL})`)
    }
  }

  for (const seedPlant of seedPlants) {
    const existingPlant = await db
      .selectFrom('plants')
      .select(['id'])
      .where('common_name', '=', seedPlant.common_name)
      .executeTakeFirst()

    if (existingPlant) {
      await db.updateTable('plants').set(seedPlant).where('id', '=', existingPlant.id).execute()
    } else {
      await db.insertInto('plants').values(seedPlant).execute()
    }
  }

  console.log('Plants seeded or updated (5 invasive alien species)')

  console.log('Seeding complete. Map Explorer and Analytics sample data were skipped.')
  await db.destroy()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
