import { PlantRepo } from './repo'
import { listPlants } from './queries/list'
import { getPlantById } from './queries/get-by-id'
import { createPlant } from './commands/create'
import { updatePlant } from './commands/update'
import { deletePlant } from './commands/delete'

export const plantModule = (deps: {
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
      list: listPlants({ plantRepo }),
      byId: getPlantById({ plantRepo }),
    },
  }
}
