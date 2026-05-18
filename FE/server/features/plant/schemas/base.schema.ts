import { z } from '@/lib/openapi/zod'

export const CommonNameSchema = z.string().openapi({
  example: 'Red Maple',
})
export const ScientificNameSchema = z.string().openapi({
  example: 'Acer rubrum',
})
export const FamilySchema = z.string().openapi({
  example: 'Sapindaceae',
})
export const GenusSchema = z.string().openapi({
  example: 'Acer',
})
export const DescriptionSchema = z.string().openapi({
  example: 'Deciduous tree, medium-sized, red flowers in spring, red fall foliage.',
})
export const EcologySchema = z.string().openapi({
  example: 'Supports a variety of pollinators and birds; common in wetland areas.',
})
export const EnvironmentalImpactSchema = z.string().openapi({
  example: 'Generally beneficial; can dominate small wetland areas if unchecked.',
})
export const ImagePathSchema = z.string().openapi({
  example: '/images/red-maple.jpg',
})

export const PlantBaseSchema = z.object({
  commonName: CommonNameSchema,
  scientificName: ScientificNameSchema,
  family: FamilySchema,
  genus: GenusSchema,
  botanicalDescription: DescriptionSchema,
  ecologicalInformation: EcologySchema,
  environmentalImpact: EnvironmentalImpactSchema,
  imagePath: ImagePathSchema,
});

export type PlantBaseRequest = z.infer<typeof PlantBaseSchema>