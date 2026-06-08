import { updateIdentificationValidation } from './commands/update-validation'
import { getIdentificationById } from './queries/get-by-id'
import { listIdentifications } from './queries/list'
import { identificationStatistics } from './queries/statistics'
import { IdentificationRepo } from './repo'

export const createIdentificationModule = (deps: {
  identificationRepo: IdentificationRepo,
}) => {
  const { identificationRepo } = deps

  return {
    query: {
      all: listIdentifications({ identificationRepo }),
      byId: getIdentificationById({ identificationRepo }),
      statistics: identificationStatistics({ identificationRepo }),
    },
    commands: {
      updateValidation: updateIdentificationValidation({ identificationRepo }),
    },
  }
}
