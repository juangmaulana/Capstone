import { PlantRepo } from '../repo';
import { ApiError } from '@/lib/api/api-error';
import { ErrorCode } from '@/lib/api/errors/error-codes';

export const deletePlant = (deps: { plantRepo: PlantRepo }) => {
  const { plantRepo } = deps;

  return async (id: number) => {
    const deleted = await plantRepo.delete(id);

    if (!deleted) {
      throw new ApiError(ErrorCode.NOT_FOUND, 'Plant not found');
    }

    return deleted;
  };
};