import { IdentificationRepo } from './repo'
import { listIdentifications } from './queries/list'
import { getIdentificationById } from './queries/get-by-id'

export const identificationModule = (deps: {
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
