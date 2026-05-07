import { db } from '../server/db';

async function listPlants() {
  const plants = await db.selectFrom('plants').selectAll().execute();
  console.log('Total plants:', plants.length);
  plants.forEach((p: any) => {
    console.log(`- ID: ${p.id}, Scientific Name: "${p.scientific_name}"`);
  });
  process.exit(0);
}

listPlants().catch(err => {
  console.error(err);
  process.exit(1);
});
