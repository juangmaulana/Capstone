import { Kysely, PostgresDialect, sql } from 'kysely'
import { Database, PlantInsert } from '../db/types'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { getScientificNameWithAuthor } from '../../lib/plant/scientific-name-author'

const CANONICAL_ADMIN_EMAIL = process.env.FALLBACK_ADMIN_EMAIL ?? 'admin@bio-inspector.id'
const CANONICAL_ADMIN_PASSWORD = process.env.FALLBACK_ADMIN_PASSWORD ?? 'admin123'
const CANONICAL_ADMIN_NAME = process.env.FALLBACK_ADMIN_NAME ?? 'Admin'
const LEGACY_ADMIN_EMAIL = 'admin@biowatch.id'

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
    await db.schema
      .alterTable(tableName)
      .renameColumn(oldColumnName, newColumnName)
      .execute()
    console.log(`Renamed ${tableName}.${oldColumnName} to ${newColumnName}`)
  }
}

async function ensureColumn(
  db: Kysely<Database>,
  tableName: string,
  columnName: string,
  columnType: 'boolean' | 'double precision' | 'text' | 'varchar(255)'
) {
  if (await columnExists(db, tableName, columnName)) return

  const builder = db.schema.alterTable(tableName)
  if (columnType === 'boolean') {
    await builder.addColumn(columnName, 'boolean', (col) => col.notNull().defaultTo(true)).execute()
  } else if (columnType === 'double precision') {
    await builder.addColumn(columnName, 'double precision', (col) => col.notNull().defaultTo(0)).execute()
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
  await ensureColumn(db, 'images', 'elevation', 'double precision')
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

const seedObservations = [
  {
    commonName: 'Babul',
    fileName: 'obs-vachellia-bekol-20251215.gif',
    filePath: '/sketsa-herbarium-acacia-nilotica.gif',
    fileSize: 190669,
    latitude: -7.838,
    longitude: 114.375,
    elevation: 78,
    confidence: 0.96,
    identifiedAt: new Date('2025-12-15T09:32:00'),
  },
  {
    commonName: 'Tembelekan',
    fileName: 'obs-lantana-bama-20251120.jpg',
    filePath: '/sketsa-herbarium-lantana-camara.jpg',
    fileSize: 422707,
    latitude: -7.842,
    longitude: 114.391,
    elevation: 14,
    confidence: 0.88,
    identifiedAt: new Date('2025-11-20T08:14:00'),
  },
  {
    commonName: 'Kangkung Pagar',
    fileName: 'obs-merremia-baluran-20260105.jpg',
    filePath: '/sketsa-herbarium-merremia-hederacea.jpg',
    fileSize: 407962,
    latitude: -7.815,
    longitude: 114.368,
    elevation: 247,
    confidence: 0.78,
    identifiedAt: new Date('2026-01-05T10:47:00'),
  },
  {
    commonName: 'Telang',
    fileName: 'obs-clitoria-forest-20260210.jpg',
    filePath: '/sketsa-herbarium-clitoria-ternatea.jpg',
    fileSize: 536678,
    latitude: -7.855,
    longitude: 114.410,
    elevation: 22,
    confidence: 0.95,
    identifiedAt: new Date('2026-02-10T06:28:00'),
  },
  {
    commonName: 'Bandotan',
    fileName: 'obs-ageratum-sumber-batang-20260128.jpg',
    filePath: '/sketsa-herbarium-Ageratum-conyzoides.webp',
    fileSize: 639898,
    latitude: -7.820,
    longitude: 114.385,
    elevation: 61,
    confidence: 0.75,
    identifiedAt: new Date('2026-01-28T14:05:00'),
  },
]

const seedAuditLogs = [
  {
    actor_id: 'system',
    entity_id: 'seed-plants',
    entity_type: 'Plant',
    action: 'SUCCESS',
    message: 'Seeded invasive alien species reference data',
  },
  {
    actor_id: 'system',
    entity_id: 'seed-identifications',
    entity_type: 'Identification',
    action: 'SUCCESS',
    message: 'Seeded sample identification observations',
  },
  {
    actor_id: 'system',
    entity_id: 'seed-images',
    entity_type: 'Image',
    action: 'INFO',
    message: 'Seeded sample geotagged observation images',
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
    const [canonicalAdmin, legacyAdmin] = await Promise.all([
      db
        .selectFrom('users')
        .select(['id'])
        .where('email', '=', CANONICAL_ADMIN_EMAIL)
        .executeTakeFirst(),
      db
        .selectFrom('users')
        .select(['id'])
        .where('email', '=', LEGACY_ADMIN_EMAIL)
        .executeTakeFirst(),
    ])
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
        await db
          .deleteFrom('users')
          .where('id', '=', legacyAdmin.id)
          .execute()
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
      console.log(`Admin user seeded (email: ${CANONICAL_ADMIN_EMAIL}, password: ${CANONICAL_ADMIN_PASSWORD})`)
    }
  }

  for (const seedPlant of seedPlants) {
    const existingPlant = await db
      .selectFrom('plants')
      .select(['id'])
      .where('common_name', '=', seedPlant.common_name)
      .executeTakeFirst()

    if (existingPlant) {
      await db
        .updateTable('plants')
        .set(seedPlant)
        .where('id', '=', existingPlant.id)
        .execute()
    } else {
      await db.insertInto('plants').values(seedPlant).execute()
    }
  }

  console.log('Plants seeded or updated (5 invasive alien species)')

  for (const seedObservation of seedObservations) {
    const plant = await db
      .selectFrom('plants')
      .select(['id', 'scientific_name'])
      .where('common_name', '=', seedObservation.commonName)
      .executeTakeFirst()

    if (!plant) continue

    const imageData = {
      file_name: seedObservation.fileName,
      file_path: seedObservation.filePath,
      file_size: seedObservation.fileSize,
      latitude: seedObservation.latitude,
      longitude: seedObservation.longitude,
      elevation: seedObservation.elevation,
    }

    const existingImage = await db
      .selectFrom('images')
      .select(['id'])
      .where('file_name', '=', seedObservation.fileName)
      .executeTakeFirst()

    const imageId = existingImage
      ? existingImage.id
      : (await db.insertInto('images').values(imageData).returning('id').executeTakeFirstOrThrow()).id

    if (existingImage) {
      await db
        .updateTable('images')
        .set(imageData)
        .where('id', '=', existingImage.id)
        .execute()
    }

    const identificationData = {
      plant_id: plant.id,
      image_id: imageId,
      confidence: seedObservation.confidence,
      ai_response: `Seeded identification for ${plant.scientific_name}`,
      is_success: true,
      identified_at: seedObservation.identifiedAt,
    }

    const existingIdentification = await db
      .selectFrom('identifications')
      .select(['id'])
      .where('image_id', '=', imageId)
      .executeTakeFirst()

    if (existingIdentification) {
      await db
        .updateTable('identifications')
        .set(identificationData)
        .where('id', '=', existingIdentification.id)
        .execute()
    } else {
      await db.insertInto('identifications').values(identificationData).execute()
    }
  }

  console.log('Images and identifications seeded or updated')

  for (const seedAuditLog of seedAuditLogs) {
    const existingAuditLog = await db
      .selectFrom('audit_logs')
      .select(['id'])
      .where('actor_id', '=', seedAuditLog.actor_id)
      .where('entity_id', '=', seedAuditLog.entity_id)
      .where('action', '=', seedAuditLog.action)
      .executeTakeFirst()

    if (existingAuditLog) {
      await db
        .updateTable('audit_logs')
        .set(seedAuditLog)
        .where('id', '=', existingAuditLog.id)
        .execute()
    } else {
      await db
        .insertInto('audit_logs')
        .values({
          id: crypto.randomUUID(),
          ...seedAuditLog,
        })
        .execute()
    }
  }

  console.log('Audit logs seeded or updated')
  console.log('Seeding complete!')
  await db.destroy()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
