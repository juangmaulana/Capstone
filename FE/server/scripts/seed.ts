import { Kysely, PostgresDialect, sql } from 'kysely'
import { Database } from '../db/types'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { getScientificNameWithAuthor } from '../../lib/plant/scientific-name-author'

async function seed() {
  const db = new Kysely<Database>({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: process.env.DATABASE_URL,
      }),
    }),
  })

  console.log('Seeding database...')

  await sql`
    ALTER TABLE plants
    ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT ''
  `.execute(db)

  await sql`
    ALTER TABLE plants
    ADD COLUMN IF NOT EXISTS image_source text NOT NULL DEFAULT ''
  `.execute(db)

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

  const imageSourceText = {
    vachelliaNilotica: 'https://www.fao.org/4/q2934e/q2934e04.htm',
    lantanaCamara: 'https://indiaflora-ces.iisc.ac.in/FloraPeninsular/herbsheet.php?id=9534&cat=7',
    merremiaHederacea: 'https://indiaflora-ces.iisc.ac.in/FloraPeninsular/herbsheet.php?id=2896&cat=7',
    clitoriaTernatea: 'https://indiaflora-ces.iisc.ac.in/FloraKarnataka/herbsheet.php?id=1908&cat=1',
    ageratumConyzoides: 'https://www.researchgate.net/figure/Figura-2-a-c-Ageratum-conyzoides-a-habito-b-capitulo-c-flor-Teles-et-al-575-d_fig1_283232634',
  }

  const seedPlants = [
    {
      common_name: 'Babul',
      scientific_name: getScientificNameWithAuthor('Vachellia nilotica'),
      family: 'Fabaceae',
      genus: 'Vachellia',
      botanical_description: 'Vachellia nilotica adalah pohon berduri invasif dengan daun majemuk menyirip ganda. Tinggi mencapai 5-20 m, memiliki bunga kuning bulat dan polong coklat kehitaman. Kulit kayu berwarna abu-abu kehitaman dan berduri panjang.',
      ecological_information: 'Gulma berkayu invasif di Taman Nasional Baluran yang awalnya diperkenalkan sebagai sekat bakar. Menyebar agresif di sabana Bekol, membentuk semak belukar padat yang menekan pertumbuhan rumput asli penting bagi Banteng Jawa.',
      environmental_impact: 'Mengubah ekosistem sabana menjadi semak belukar, mengurangi area penggembalaan bagi herbivora lokal, mengganggu siklus kebakaran alami, dan menekan keanekaragaman hayati asli.',
      botanical_description_en: 'Vachellia nilotica is an invasive thorny tree with bipinnate compound leaves. It can reach 5-20 m in height, produces round yellow flowers and dark brown to black pods, and has grey-black bark with long thorns.',
      botanical_description_id: 'Vachellia nilotica adalah pohon berduri invasif dengan daun majemuk menyirip ganda. Tinggi mencapai 5-20 m, memiliki bunga kuning bulat dan polong coklat kehitaman. Kulit kayu berwarna abu-abu kehitaman dan berduri panjang.',
      ecological_information_en: 'A woody invasive weed in Baluran National Park that was originally introduced as a firebreak. It spreads aggressively in Bekol Savanna and forms dense thickets that suppress native grasses important for the Javan banteng.',
      ecological_information_id: 'Gulma berkayu invasif di Taman Nasional Baluran yang awalnya diperkenalkan sebagai sekat bakar. Menyebar agresif di sabana Bekol, membentuk semak belukar padat yang menekan pertumbuhan rumput asli penting bagi Banteng Jawa.',
      environmental_impact_en: 'Transforms savanna ecosystems into dense shrubland, reduces grazing areas for local herbivores, disrupts natural fire cycles, and suppresses native biodiversity.',
      environmental_impact_id: 'Mengubah ekosistem sabana menjadi semak belukar, mengurangi area penggembalaan bagi herbivora lokal, mengganggu siklus kebakaran alami, dan menekan keanekaragaman hayati asli.',
      image_path: '/sketsa-herbarium-acacia-nilotica.gif',
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      tax_class: 'Magnoliopsida',
      order_rank: 'Fabales',
      tax_species: 'V. nilotica',
      source: sourceText.vachelliaNilotica,
      image_source: imageSourceText.vachelliaNilotica,
    },
    {
      common_name: 'Tembelekan',
      scientific_name: getScientificNameWithAuthor('Lantana camara'),
      family: 'Verbenaceae',
      genus: 'Lantana',
      botanical_description: 'Semak tegak bercabang dengan batang berkayu berduri kecil. Daun berhadapan, berkerut, berbulu kasar. Bunga majemuk berwarna-warni (kuning, oranye, merah, merah muda) dalam payung datar.',
      ecological_information: 'Spesies asing sangat invasif di daerah tropis dan subtropis. Membentuk semak belukar padat dan tak tertembus yang mengalahkan flora asli, mengubah rezim kebakaran, dan mengurangi lahan penggembalaan satwa liar.',
      environmental_impact: 'Sangat invasif, meracuni ternak, menekan pertumbuhan tanaman asli melalui alelopati, dan meningkatkan intensitas kebakaran hutan.',
      botanical_description_en: 'Lantana camara is an upright, branching shrub with woody stems and small prickles. Its opposite leaves are wrinkled and rough-hairy, and its flower clusters are multicolored, commonly yellow, orange, red, or pink.',
      botanical_description_id: 'Semak tegak bercabang dengan batang berkayu berduri kecil. Daun berhadapan, berkerut, berbulu kasar. Bunga majemuk berwarna-warni (kuning, oranye, merah, merah muda) dalam payung datar.',
      ecological_information_en: 'A highly invasive alien species in tropical and subtropical regions. It forms dense, nearly impenetrable thickets that outcompete native flora, alter fire regimes, and reduce wildlife grazing areas.',
      ecological_information_id: 'Spesies asing sangat invasif di daerah tropis dan subtropis. Membentuk semak belukar padat dan tak tertembus yang mengalahkan flora asli, mengubah rezim kebakaran, dan mengurangi lahan penggembalaan satwa liar.',
      environmental_impact_en: 'Highly invasive, toxic to livestock, suppresses native plant growth through allelopathy, and can increase forest fire intensity.',
      environmental_impact_id: 'Sangat invasif, meracuni ternak, menekan pertumbuhan tanaman asli melalui alelopati, dan meningkatkan intensitas kebakaran hutan.',
      image_path: '/sketsa-herbarium-lantana-camara.jpg',
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      tax_class: 'Magnoliopsida',
      order_rank: 'Lamiales',
      tax_species: 'L. camara',
      source: sourceText.lantanaCamara,
      image_source: imageSourceText.lantanaCamara,
    },
    {
      common_name: 'Kangkung Pagar',
      scientific_name: getScientificNameWithAuthor('Merremia hederacea'),
      family: 'Convolvulaceae',
      genus: 'Merremia',
      botanical_description: 'Tanaman merambat herba tahunan dari keluarga Convolvulaceae. Daun berbentuk jantung hingga berlekuk 3-5 jari, tipis, dan berwarna hijau cerah. Bunga berbentuk corong berwarna kuning pucat hingga putih. Buah kapsul membulat berisi biji kecil.',
      ecological_information: 'Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.',
      environmental_impact: 'Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.',
      botanical_description_en: 'Merremia hederacea is an annual herbaceous climber in the Convolvulaceae family. It has thin bright-green leaves that are heart-shaped to 3-5 lobed, pale yellow to white funnel-shaped flowers, and rounded capsules containing small seeds.',
      botanical_description_id: 'Tanaman merambat herba tahunan dari keluarga Convolvulaceae. Daun berbentuk jantung hingga berlekuk 3-5 jari, tipis, dan berwarna hijau cerah. Bunga berbentuk corong berwarna kuning pucat hingga putih. Buah kapsul membulat berisi biji kecil.',
      ecological_information_en: 'Grows aggressively along forest edges, open land, and disturbed tropical areas. Merremia hederacea spreads rapidly over understory vegetation and can climb trees, shading their crowns.',
      ecological_information_id: 'Tumbuh agresif di tepi hutan, lahan terbuka, dan area terganggu di kawasan tropis. Merremia hederacea merambat cepat menutupi vegetasi bawah dan mampu memanjat pohon hingga menaungi tajuknya.',
      environmental_impact_en: 'Covers native plants and reduces photosynthesis, suppresses natural forest regeneration, and changes vegetation structure in savannas and forest edges of Baluran National Park.',
      environmental_impact_id: 'Menutupi tanaman asli sehingga menghambat fotosintesis, menekan regenerasi alami hutan, dan mengubah struktur vegetasi di sabana dan tepi hutan Taman Nasional Baluran.',
      image_path: '/sketsa-herbarium-merremia-hederacea.jpg',
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      tax_class: 'Magnoliopsida',
      order_rank: 'Solanales',
      tax_species: 'M. hederacea',
      source: sourceText.merremiaHederacea,
      image_source: imageSourceText.merremiaHederacea,
    },
    {
      common_name: 'Telang',
      scientific_name: getScientificNameWithAuthor('Clitoria ternatea'),
      family: 'Fabaceae',
      genus: 'Clitoria',
      botanical_description: 'Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.',
      ecological_information: 'Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.',
      environmental_impact: 'Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.',
      botanical_description_en: 'Clitoria ternatea is a perennial herbaceous climber in the Fabaceae family. It has odd-pinnate compound leaves with 5-7 leaflets, butterfly-shaped deep blue to purple flowers that are sometimes white, and flat pods with kidney-shaped seeds.',
      botanical_description_id: 'Tanaman merambat herba perennial dari keluarga Fabaceae. Daun majemuk menyirip ganjil dengan 5-7 anak daun. Bunga berbentuk kupu-kupu berwarna biru tua hingga ungu, kadang putih. Polong pipih berisi biji berbentuk ginjal.',
      ecological_information_en: 'Grows in tropical and subtropical areas and tolerates many soil types. In Baluran National Park, it spreads through savanna areas and forest margins, competing with native vegetation for sunlight and nutrients.',
      ecological_information_id: 'Tumbuh di daerah tropis dan subtropis, toleran terhadap berbagai jenis tanah. Di Taman Nasional Baluran, tanaman ini menyebar di area sabana dan pinggiran hutan, bersaing dengan vegetasi asli untuk mendapatkan sinar matahari dan nutrisi.',
      environmental_impact_en: 'Can suppress native grasses through dense shading, alter savanna vegetation composition, and disrupt forage availability for native herbivores such as the Javan banteng.',
      environmental_impact_id: 'Mampu menekan pertumbuhan rumput asli melalui naungan yang padat, mengubah komposisi vegetasi sabana, dan mengganggu ketersediaan pakan bagi herbivora asli seperti Banteng Jawa.',
      image_path: '/sketsa-herbarium-clitoria-ternatea.jpg',
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      tax_class: 'Magnoliopsida',
      order_rank: 'Fabales',
      tax_species: 'C. ternatea',
      source: sourceText.clitoriaTernatea,
      image_source: imageSourceText.clitoriaTernatea,
    },
    {
      common_name: 'Bandotan',
      scientific_name: getScientificNameWithAuthor('Ageratum conyzoides'),
      family: 'Asteraceae',
      genus: 'Ageratum',
      botanical_description: 'Gulma herba tahunan setinggi 30-80 cm. Daun berhadapan berbentuk oval dengan tepi bergerigi. Bunga biru-ungu pucat atau putih dalam payung terminal. Batang berbulu halus.',
      ecological_information: 'Terkenal karena produksi bijinya yang tinggi dan kemampuan beradaptasi. Menyerang lahan terganggu, ladang pertanian, dan ekosistem alami. Menghasilkan bahan kimia alelopati.',
      environmental_impact: 'Menghambat pertumbuhan tanaman asli melalui alelopati, bersifat racun bagi hewan pemakan rumput, dan menjadi gulma persisten di lahan pertanian.',
      botanical_description_en: 'Ageratum conyzoides is an annual herbaceous weed that grows 30-80 cm tall. It has opposite oval leaves with toothed margins, pale blue-purple or white terminal flower heads, and softly hairy stems.',
      botanical_description_id: 'Gulma herba tahunan setinggi 30-80 cm. Daun berhadapan berbentuk oval dengan tepi bergerigi. Bunga biru-ungu pucat atau putih dalam payung terminal. Batang berbulu halus.',
      ecological_information_en: 'Known for high seed production and strong adaptability. It invades disturbed land, agricultural fields, and natural ecosystems, and produces allelopathic chemicals.',
      ecological_information_id: 'Terkenal karena produksi bijinya yang tinggi dan kemampuan beradaptasi. Menyerang lahan terganggu, ladang pertanian, dan ekosistem alami. Menghasilkan bahan kimia alelopati.',
      environmental_impact_en: 'Inhibits native plant growth through allelopathy, can be toxic to grazing animals, and persists as a troublesome agricultural weed.',
      environmental_impact_id: 'Menghambat pertumbuhan tanaman asli melalui alelopati, bersifat racun bagi hewan pemakan rumput, dan menjadi gulma persisten di lahan pertanian.',
      image_path: '/sketsa-herbarium-Ageratum-conyzoides.webp',
      kingdom: 'Plantae',
      phylum: 'Tracheophyta',
      tax_class: 'Magnoliopsida',
      order_rank: 'Asterales',
      tax_species: 'A. conyzoides',
      source: sourceText.ageratumConyzoides,
      image_source: imageSourceText.ageratumConyzoides,
    },
  ]

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

  console.log('Seeding complete!')
  await db.destroy()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
