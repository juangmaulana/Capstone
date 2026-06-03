import { z } from '@/lib/openapi/zod'

export const CommonNameSchema = z.string().openapi({
  example: 'Red Maple',
})
export const ScientificNameSchema = z.string().openapi({
  example: 'Acer rubrum',
})
export const KingdomSchema = z.string().openapi({ 
  example: 'Plantae' 
})
export const PhylumSchema = z.string().openapi({ 
  example: 'Tracheophyta'  
})
export const ClassSchema = z.string().openapi({ 
  example: 'Tracheophyta'  
})
export const OrderSchema = z.string().openapi({ 
  example: 'Tracheophyta'  
})
export const FamilySchema = z.string().openapi({
  example: 'Sapindaceae',
})
export const GenusSchema = z.string().openapi({
  example: 'Acer',
})
export const SpeciesSchema = z.string().openapi({ 
  example: 'Tracheophyta'  
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
export const SourceReferenceSchema =  z.string().openapi({ 
  example: 'https://www.gbif.org/species/3974744\nhttps://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77089275-1' 
})
export const ImagePathSchema = z.string().openapi({
  example: '/images/red-maple.jpg',
})
export const ImageReferenceSchema =  z.string().openapi({ 
  example: 'https://indiaflora-ces.iisc.ac.in/FloraKarnataka/herbsheet.php?id=1846&cat=1'     
})
export const IsDetectableSchema = z.coerce.boolean().openapi({
  example: true
})

export const PlantBaseSchema = z.object({
  commonName: CommonNameSchema,
  scientificName: ScientificNameSchema,
  kingdom: KingdomSchema,
  phylum: PhylumSchema,
  class: ClassSchema,
  order: OrderSchema,
  family: FamilySchema,
  genus: GenusSchema,
  species: SpeciesSchema,
  botanicalDescription: DescriptionSchema,
  ecologicalInformation: EcologySchema,
  environmentalImpact: EnvironmentalImpactSchema,
  sourceReference: SourceReferenceSchema,
  imagePath: ImagePathSchema,
  imageReference: ImageReferenceSchema,
  isDetectable: IsDetectableSchema,
});

export type PlantBaseRequest = z.infer<typeof PlantBaseSchema>