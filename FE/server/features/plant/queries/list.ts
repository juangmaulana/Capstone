import { PlantRepo } from '../repo'
import { PlantFilterRequest } from '../schemas/filter.schema'

export const listPlants = (deps: {
  plantRepo: PlantRepo,
}) => async (filter: PlantFilterRequest) => {
  return deps.plantRepo.findAll(filter)
}