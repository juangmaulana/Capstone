import { Kysely } from 'kysely';
import { Database } from '../db/types';

const SCIENTIFIC_NAME_AUTHORS = [
  {
    oldName: 'Vachellia nilotica',
    newName: 'Vachellia nilotica (L.) P.J.H.Hurter & Mabb.',
  },
  {
    oldName: 'Lantana camara',
    newName: 'Lantana camara L.',
  },
  {
    oldName: 'Merremia hederacea',
    newName: 'Merremia hederacea (Burm.f.) Hallier f.',
  },
  {
    oldName: 'Clitoria ternatea',
    newName: 'Clitoria ternatea L.',
  },
  {
    oldName: 'Ageratum conyzoides',
    newName: 'Ageratum conyzoides L.',
  },
] as const;

export async function up(db: Kysely<Database>) {
  for (const { oldName, newName } of SCIENTIFIC_NAME_AUTHORS) {
    await db
      .updateTable('plants')
      .set({ scientific_name: newName })
      .where('scientific_name', '=', oldName)
      .execute();
  }
}

export async function down(db: Kysely<Database>) {
  for (const { oldName, newName } of SCIENTIFIC_NAME_AUTHORS) {
    await db
      .updateTable('plants')
      .set({ scientific_name: oldName })
      .where('scientific_name', '=', newName)
      .execute();
  }
}
