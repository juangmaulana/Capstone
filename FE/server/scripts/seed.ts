import { Kysely, PostgresDialect } from 'kysely'
import { Database } from '../db/types'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

async function seed() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  })

  console.log('🌱 Seeding database...')

  // --- Seed Roles ---
  const existingRoles = await db.selectFrom('roles').selectAll().execute()
  if (existingRoles.length === 0) {
    await db.insertInto('roles').values([
      { name: 'Super Admin', description: 'Full system access' },
      { name: 'Admin', description: 'Administrative access' },
      { name: 'Researcher', description: 'Research and data access' },
      { name: 'Field Officer', description: 'Field data collection' },
    ]).execute()
    console.log('✅ Roles seeded')
  } else {
    console.log('⏭️  Roles already exist, skipping')
  }

  // --- Seed Admin User ---
  const existingUsers = await db.selectFrom('users').selectAll().execute()
  if (existingUsers.length === 0) {
    const adminRole = await db.selectFrom('roles').selectAll().where('name', '=', 'Super Admin').executeTakeFirst()
    if (adminRole) {
      const passwordHash = await bcrypt.hash('admin123', 10)
      await db.insertInto('users').values({
        role_id: adminRole.id,
        name: 'Admin',
        email: 'admin@biowatch.id',
        password: passwordHash,
      }).execute()
      console.log('✅ Admin user seeded (email: admin@biowatch.id, password: admin123)')
    }
  } else {
    console.log('⏭️  Users already exist, skipping')
  }

  // --- Seed Plants (5 Invasive Alien Species in Baluran) ---
  const existingPlants = await db.selectFrom('plants').selectAll().execute()
  if (existingPlants.length === 0) {
    await db.insertInto('plants').values([
      {
        common_name: 'Babul',
        scientific_name: 'Vachellia nilotica',
        family: 'Fabaceae',
        genus: 'Vachellia',
        botanical_description: 'Vachellia nilotica adalah pohon berduri invasif dengan daun majemuk menyirip ganda. Tinggi mencapai 5-20 m, memiliki bunga kuning bulat dan polong coklat kehitaman. Kulit kayu berwarna abu-abu kehitaman dan berduri panjang.',
        ecological_information: 'Gulma berkayu invasif di Taman Nasional Baluran yang awalnya diperkenalkan sebagai sekat bakar. Menyebar agresif di sabana Bekol, membentuk semak belukar padat yang menekan pertumbuhan rumput asli penting bagi Banteng Jawa.',
        environmental_impact: 'Mengubah ekosistem sabana menjadi semak belukar, mengurangi area penggembalaan bagi herbivora lokal, mengganggu siklus kebakaran alami, dan menekan keanekaragaman hayati asli.',
        image_path: '/sketsa-herbarium-acacia-nilotica.gif',
      },
      {
        common_name: 'Tembelekan',
        scientific_name: 'Lantana camara',
        family: 'Verbenaceae',
        genus: 'Lantana',
        botanical_description: 'Semak tegak bercabang dengan batang berkayu berduri kecil. Daun berhadapan, berkerut, berbulu kasar. Bunga majemuk berwarna-warni (kuning, oranye, merah, merah muda) dalam payung datar.',
        ecological_information: 'Spesies asing sangat invasif di daerah tropis dan subtropis. Membentuk semak belukar padat dan tak tertembus yang mengalahkan flora asli, mengubah rezim kebakaran, dan mengurangi lahan penggembalaan satwa liar.',
        environmental_impact: 'Sangat invasif, meracuni ternak, menekan pertumbuhan tanaman asli melalui alelopati, dan meningkatkan intensitas kebakaran hutan.',
        image_path: '/sketsa-herbarium-lantana-camara.jpg',
      },
      {
        common_name: 'Sembung Rambat',
        scientific_name: 'Mikania micrantha',
        family: 'Asteraceae',
        genus: 'Mikania',
        botanical_description: 'Tanaman rambat tahunan tumbuh sangat cepat (dikenal sebagai "gulma satu mil per menit"). Daun berbentuk jantung berhadapan, bunga putih kecil dalam tandan. Batang merambat dan memanjat.',
        ecological_information: 'Ancaman serius bagi ekosistem tropis karena cepat memanjat tanaman dan pohon lain, mencekik dan menghalangi sinar matahari sehingga menyebabkan kematian vegetasi di bawahnya.',
        environmental_impact: 'Menutupi kanopi pohon hingga mati, mengurangi produktivitas pertanian, dan mengancam keanekaragaman hayati di hutan tropis.',
        image_path: '/sketsa-herbarium-Mikania-micrantha.jpg',
      },
      {
        common_name: 'Kirinyuh',
        scientific_name: 'Chromolaena odorata',
        family: 'Asteraceae',
        genus: 'Chromolaena',
        botanical_description: 'Semak tahunan tumbuh cepat, tinggi 1.5-3 m. Daun berhadapan berbentuk segitiga dengan tepi bergerigi. Bunga biru-ungu pucat dalam tandan terminal. Batang berkayu di bagian bawah.',
        ecological_information: 'Menyerang tepi hutan, sabana, dan lahan pertanian secara agresif. Menekan pertumbuhan tanaman asli melalui persaingan dan alelopati. Sangat mudah terbakar sehingga meningkatkan risiko kebakaran.',
        environmental_impact: 'Mengurangi keanekaragaman hayati, meningkatkan frekuensi dan intensitas kebakaran, dan mengganggu regenerasi hutan alami.',
        image_path: '/sketsa-herbarium-Chromolaena-odorata.webp',
      },
      {
        common_name: 'Bandotan',
        scientific_name: 'Ageratum conyzoides',
        family: 'Asteraceae',
        genus: 'Ageratum',
        botanical_description: 'Gulma herba tahunan setinggi 30-80 cm. Daun berhadapan berbentuk oval dengan tepi bergerigi. Bunga biru-ungu pucat atau putih dalam payung terminal. Batang berbulu halus.',
        ecological_information: 'Terkenal karena produksi bijinya yang tinggi dan kemampuan beradaptasi. Menyerang lahan terganggu, ladang pertanian, dan ekosistem alami. Menghasilkan bahan kimia alelopati.',
        environmental_impact: 'Menghambat pertumbuhan tanaman asli melalui alelopati, bersifat racun bagi hewan pemakan rumput, dan menjadi gulma persisten di lahan pertanian.',
        image_path: '/sketsa-herbarium-Ageratum-conyzoides.webp',
      },
    ]).execute()
    console.log('✅ Plants seeded (5 invasive alien species)')
  } else {
    console.log('⏭️  Plants already exist, skipping')
  }

  console.log('🎉 Seeding complete!')
  await db.destroy()
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
