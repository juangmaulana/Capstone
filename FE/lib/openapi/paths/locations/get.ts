import { LocationFilterSchema } from '@/server/services/locations/schema/filter.schema';
import { registry } from '../../registry';
import { LocationDetailSchema } from '@/server/services/locations/schema/detail.schema';
import { NearbyImagesSchema } from '@/server/services/locations/schema/nearby.schema';

registry.registerPath({
  method: 'get',
  path: 'api/v1/locations',
  tags: ['Locations'],
  summary: 'Fetch all locations',
  request: {
    query: LocationFilterSchema,
  },
  responses: {
    200: {
      description: 'Locations fetched',
    }
  }
})

registry.registerPath({
  method: 'get',
  path: 'api/v1/locations/details',
  tags: ['Locations'],
  summary: 'Fetch location\'s details',
  request: {
    query: LocationDetailSchema,
  },
  responses: {
    200: {
      description: 'Location\'s details fetched',
    }
  }
})

registry.registerPath({
  method: 'get',
  path: 'api/v1/locations/nearby',
  tags: ['Locations'],
  summary: 'Fetch nearby images',
  request: {
    query: NearbyImagesSchema,
  },
  responses: {
    200: {
      description: 'Nearby images fetched',
    }
  }
})

registry.registerPath({
  method: 'get',
  path: 'api/v1/locations/stats',
  tags: ['Locations'],
  summary: 'Fetch location stats',
  responses: {
    200: {
      description: 'Location stats fetched',
    }
  }
})