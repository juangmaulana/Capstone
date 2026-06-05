import { ApiError } from '@/lib/api/api-error'
import { db } from '@/server/db'
import { LocationFilterRequest } from './schema/filter.schema'
import { LocationDetailRequest } from './schema/detail.schema'
import { NearbyImagesRequest } from './schema/nearby.schema'

const LOCATION_API_URL = process.env.UPLOAD_API_URL

type LocalImageLocation = {
  id: number
  fileName: string
  filePath: string
  fileSize: number
  latitude: number
  longitude: number
  elevation: number
  uploadedAt: Date
}

const toLocalImageLocation = (image: {
  id: number
  file_name: string
  file_path: string
  file_size: number
  latitude: number
  longitude: number
  elevation: number
  uploaded_at: Date
}): LocalImageLocation => ({
  id: image.id,
  fileName: image.file_name,
  filePath: image.file_path,
  fileSize: image.file_size,
  latitude: Number(image.latitude),
  longitude: Number(image.longitude),
  elevation: Number(image.elevation),
  uploadedAt: image.uploaded_at,
})

const formatCoordinates = (latitude: number, longitude: number) => {
  const lat = latitude.toFixed(5)
  const lng = longitude.toFixed(5)
  return `${lat}, ${lng}`
}

const fetchUploadServiceJson = async (path: string) => {
  if (!LOCATION_API_URL) return null

  const response = await fetch(`${LOCATION_API_URL}${path}`)
  const json = await response.json()
  const serviceStatus = json.status ?? (json.success ? 'success' : undefined)
  if (serviceStatus !== 'success') {
    throw new ApiError('UNKNOWN', `[Location Service] ${json.message ?? json.error?.message ?? 'Unknown error'}`)
  }

  return json.data ?? json
}

const getLocalImages = async () => {
  const rows = await db
    .selectFrom('images')
    .selectAll()
    .orderBy('uploaded_at', 'desc')
    .execute()

  return rows.map(toLocalImageLocation)
}

const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRadians = (value: number) => value * Math.PI / 180
  const earthRadiusKm = 6371
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(deltaLon / 2) ** 2

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const getLocalLocations = async (filter: LocationFilterRequest) => {
  const page = filter.page ?? 1
  const limit = filter.limit ?? 10
  const images = await getLocalImages()
  const grouped = new Map<string, LocalImageLocation[]>()

  images.forEach((image) => {
    const key = `${image.latitude.toFixed(5)},${image.longitude.toFixed(5)}`
    const items = grouped.get(key) ?? []
    items.push(image)
    grouped.set(key, items)
  })

  const locations = Array.from(grouped.values()).map((items, index) => {
    const [first] = items
    const fallbackName = formatCoordinates(first.latitude, first.longitude)
    return {
      id: index + 1,
      name: fallbackName,
      location: fallbackName,
      latitude: first.latitude,
      longitude: first.longitude,
      elevation: first.elevation,
      imageCount: items.length,
      latestImageAt: first.uploadedAt,
    }
  })

  const offset = (page - 1) * limit

  return {
    locations: locations.slice(offset, offset + limit),
    total: locations.length,
    page,
    limit,
  }
}

const getLocalLocationDetails = async (req: LocationDetailRequest) => {
  const images = await getLocalImages()
  const nearest = images
    .map((image) => ({
      ...image,
      distanceKm: getDistanceKm(req.latitude, req.longitude, image.latitude, image.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0]
  const fallbackName = formatCoordinates(req.latitude, req.longitude)

  return {
    name: fallbackName,
    location: fallbackName,
    latitude: req.latitude,
    longitude: req.longitude,
    elevation: nearest?.elevation ?? 0,
    nearestImageId: nearest?.id ?? null,
    distanceKm: nearest?.distanceKm ?? null,
  }
}

const getLocalLocationStats = async () => {
  const images = await getLocalImages()
  const locations = new Set(images.map((image) => `${image.latitude.toFixed(5)},${image.longitude.toFixed(5)}`))
  const elevations = images.map((image) => image.elevation).filter(Number.isFinite)
  const averageElevation = elevations.length
    ? Math.round(elevations.reduce((sum, elevation) => sum + elevation, 0) / elevations.length)
    : 0

  return {
    totalLocations: locations.size,
    totalImages: images.length,
    averageElevation,
  }
}

const getLocalNearbyImages = async (req: NearbyImagesRequest) => {
  const images = await getLocalImages()
  const nearby = images
    .map((image) => ({
      name: formatCoordinates(image.latitude, image.longitude),
      location: formatCoordinates(image.latitude, image.longitude),
      id: image.id,
      latitude: image.latitude,
      longitude: image.longitude,
      elevation: image.elevation,
      fileName: image.fileName,
      filePath: image.filePath,
      fileSize: image.fileSize,
      uploadedAt: image.uploadedAt,
      distanceKm: getDistanceKm(req.latitude, req.longitude, image.latitude, image.longitude),
    }))
    .filter((image) => image.distanceKm <= req.radius)
    .sort((a, b) => a.distanceKm - b.distanceKm)

  return {
    images: nearby,
    total: nearby.length,
    radiusKm: req.radius,
  }
}

export const listLocations = async (filter: LocationFilterRequest) => {
  try {
    const data = await fetchUploadServiceJson(`/api/locations/?page=${filter.page}&limit=${filter.limit}`)
    if (data) return data
  } catch (error) {
    console.warn('[Location Service] upload-endpoint unavailable, using local image locations:', error)
  }

  return getLocalLocations(filter)
}

export const getLocationDetails = async (req: LocationDetailRequest) => {
  try {
    const data = await fetchUploadServiceJson(`/api/locations/details?latitude=${req.latitude}&longitude=${req.longitude}`)
    if (data) return data
  } catch (error) {
    console.warn('[Location Service] upload-endpoint details unavailable, using local fallback:', error)
  }

  return getLocalLocationDetails(req)
}

export const getLocationStats = async () => {
  try {
    const data = await fetchUploadServiceJson('/api/locations/stats')
    if (data) return data
  } catch (error) {
    console.warn('[Location Service] upload-endpoint stats unavailable, using local fallback:', error)
  }

  return getLocalLocationStats()
}

export const nearbyImages = async (req: NearbyImagesRequest) => {
  try {
    const data = await fetchUploadServiceJson(`/api/locations/nearby?latitude=${req.latitude}&longitude=${req.longitude}&radius=${req.radius}`)
    if (data) return data
  } catch (error) {
    console.warn('[Location Service] upload-endpoint nearby unavailable, using local fallback:', error)
  }

  return getLocalNearbyImages(req)
}
