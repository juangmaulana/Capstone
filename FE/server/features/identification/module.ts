import { getIdentificationById } from './queries/get-by-id'
import { listIdentifications } from './queries/list'
import { IdentificationRepo } from './repo'

export const createIdentificationModule = (deps: {
  identificationRepo: IdentificationRepo,
}) => {
  const { identificationRepo } = deps

  return {
    query: {
      all: listIdentifications({ identificationRepo }),
      byId: getIdentificationById({ identificationRepo }),
    },
  }
}