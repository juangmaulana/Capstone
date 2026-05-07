
const { Kysely, PostgresDialect } = require('kysely');
const { Pool } = require('pg');

async function checkDb() {
  const db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString: "postgresql://juangmaulana@localhost:5432/biowatch",
      }),
    }),
  });

  try {
    const plants = await db.selectFrom('plants').select(['id', 'scientific_name', 'common_name']).execute();
    console.log('Plants in DB:', JSON.stringify(plants, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await db.destroy();
  }
}

checkDb();
