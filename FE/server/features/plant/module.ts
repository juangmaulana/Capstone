import { createPlant } from './commands/create';
import { deletePlant } from './commands/delete';
import { updatePlant } from './commands/update';
import { getPlantById } from './queries/get-by-id';
import { listPlants } from './queries/list';
import { PlantRepo } from './repo';

export const createPlantModule = (deps: {
  plantRepo: PlantRepo,
}) => {
  const { plantRepo } = deps
  
  return {
    command: {
      create: createPlant({ plantRepo }),
      update: updatePlant({ plantRepo }),
      delete: deletePlant({ plantRepo }),
    },
    query: {
      byId: getPlantById({ plantRepo }),
      list: listPlants({ plantRepo })
    }
  }
}