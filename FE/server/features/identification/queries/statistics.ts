import { mapDbError } from '@/lib/db/mappers';
import { IdentificationRepo } from '../repo';
import { IdentificationStatisticsFilterRequest } from '../schemas/statistics.schema';

export const identificationStatistics = (deps: {
  identificationRepo: IdentificationRepo,
}) => async (filter: IdentificationStatisticsFilterRequest) => {
  const year = filter.year ?? new Date().getFullYear()
  
  try {
    return await deps.identificationRepo.statistics({
      ...filter,
      startDate: new Date(year, 0, 1),
      endDate: new Date(year + 1, 0, 1),
    });
  } catch (err) {
    throw mapDbError(err);
  }
}