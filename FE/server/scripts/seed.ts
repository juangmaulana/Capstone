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

  console.log('Seeding database...')

  // --- Seed Roles ---
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
      console.log('Admin user seeded (email: admin@biowatch.id, password: admin123)')
    }
  } else {
    console.log('Users already exist, skipping')
  }

  // --- Seed Plants (5 Invasive Alien Species in Baluran) ---
  const seedPlants = [
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
      common_name: 'Kangkung Pagar',
      scientific_name: 'Merremia hederacea',
      family: 'Convolvulaceae',
      genus: 'Merremia',
      botanical_description: 'Tanaman merambat herba tahunan dari keluarga Convolvulaceae. Daun berbentuk jantung hingga berlekuk 3-5 jari, tipis, dan berwarna hijau cerah. Bunga berbentuk corong berwarna kuning pucat hingga putih. Buah kapsul membulat berisi biji kecil.',
      ecological_information: 'Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.',
      environmental_impact: 'Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.',
      image_path: '/sketsa-herbarium-merremia-hederacea.jpg',
    },
    {
      common_name: 'Telang',
      scientific_name: 'Clitoria ternatea',
      family: 'Fabaceae',
      genus: 'Clitoria',
      botanical_description: 'Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.',
      ecological_information: 'Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.',
      environmental_impact: 'Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.',
      image_path: '/sketsa-herbarium-clitoria-ternatea.jpg',
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
  ]

  for (const seedPlant of seedPlants) {
    const existingPlant = await db
      .selectFrom('plants')
      .select(['id'])
      .where('scientific_name', '=', seedPlant.scientific_name)
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

  console.log('Seeding complete!')
  await db.destroy()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
