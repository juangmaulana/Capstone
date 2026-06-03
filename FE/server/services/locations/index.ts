import { ApiError } from '@/lib/api/api-error'
import { LocationFilterRequest } from './schema/filter.schema'
import { LocationDetailRequest } from './schema/detail.schema'
import { NearbyImagesRequest } from './schema/nearby.schema'

const LOCATION_API_URL = process.env.UPLOAD_API_URL

export const listLocations = async (filter: LocationFilterRequest) => {
  const response = await fetch(`${LOCATION_API_URL}/api/locations/?page=${filter.page}&limit=${filter.limit}`)

  const { status, ...data }  = await response.json()
  if (status !== 'success') {
    throw new ApiError('UNKNOWN', `[Location Service] ${data.message}`)
  }

  return data
}

export const getLocationDetails = async (req: LocationDetailRequest) => {
  const response = await fetch(`${LOCATION_API_URL}/api/locations/details?latitude=${req.latitude}&longitude=${req.longitude}`)

  const { status, ...data }  = await response.json()
  if (status !== 'success') {
    throw new ApiError('UNKNOWN', `[Location Service] ${data.message}`)
  }

  return data
}

export const getLocationStats = async () => {
  const response = await fetch(`${LOCATION_API_URL}/api/locations/stats`)

  const { status, ...data }  = await response.json()
  if (status !== "success") {
    throw new ApiError('UNKNOWN', `[Location Service] ${data.message}`)
  }

  return data
}

export const nearbyImages = async (req: NearbyImagesRequest) => {
  const response = await fetch(`${LOCATION_API_URL}/api/locations/nearby?latitude=${req.latitude}&longitude=${req.longitude}&radius=${req.radius}`)

  const { status, ...data }  = await response.json()
  if (status !== 'success') {
    throw new ApiError('UNKNOWN', `[Location Service] ${data.message}`)
  }

  return data
}