
const { Kysely, PostgresDialect } = require('kysely');
const { Pool } = require('pg');

async function updateSpecies() {
  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: "postgresql://juangmaulana@localhost:5432/biowatch",
      }),
    }),
  });

  try {
    const result = await db.updateTable('plants')
      .set({ 
        scientific_name: 'Vachellia nilotica',
        botanical_description: 'Vachellia nilotica adalah pohon berduri invasif dengan daun majemuk menyirip ganda. Tinggi mencapai 5-20 m, memiliki bunga kuning bulat dan polong coklat kehitaman. Kulit kayu berwarna abu-abu kehitaman dan berduri panjang.'
      })
      .where('scientific_name', '=', 'Acacia nilotica')
      .executeTakeFirst();
    
    console.log('Update result:', result);
    console.log('Successfully renamed Acacia nilotica to Vachellia nilotica');
  } catch (err) {
    console.error('Error updating species:', err);
  } finally {
    await db.destroy();
  }
}

updateSpecies();
