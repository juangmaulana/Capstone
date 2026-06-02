import { z } from '@/lib/openapi/zod'
import { PlantBaseSchema } from './base.schema';

export const UpdatePlantSchema = PlantBaseSchema.extend({
  botanicalDescriptionEn: z.string().optional().openapi({
    example: 'Thorny tree with bipinnate leaves',
  }),
  botanicalDescriptionId: z.string().optional().openapi({
    example: 'Pohon berduri dengan daun majemuk menyirip ganda',
  }),
  ecologicalInformation: z.string().min(1).optional().openapi({
    example: 'Invasive in savanna ecosystems',
  }),
  ecologicalInformationEn: z.string().optional().openapi({
    example: 'Invasive in savanna ecosystems',
  }),
  ecologicalInformationId: z.string().optional().openapi({
    example: 'Invasif di ekosistem sabana',
  }),
  environmentalImpact: z.string().min(1).optional().openapi({
    example: 'Displaces native grass species',
  }),
  environmentalImpactEn: z.string().optional().openapi({
    example: 'Displaces native grass species',
  }),
  environmentalImpactId: z.string().optional().openapi({
    example: 'Menggeser spesies rumput asli',
  }),
  kingdom: z.string().optional().openapi({ example: 'Plantae' }),
  phylum: z.string().optional().openapi({ example: 'Tracheophyta' }),
  taxClass: z.string().optional().openapi({ example: 'Magnoliopsida' }),
  orderRank: z.string().optional().openapi({ example: 'Fabales' }),
  taxSpecies: z.string().optional().openapi({ example: 'V. nilotica' }),
  source: z.string().optional().openapi({ example: 'https://www.gbif.org/species/3974744\nhttps://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77089275-1' }),
  imageSource: z.string().optional().openapi({ example: 'https://indiaflora-ces.iisc.ac.in/FloraKarnataka/herbsheet.php?id=1846&cat=1' }),
}).partial().openapi({
  title: 'UpdatePlantRequest',
})

export type UpdatePlantRequest = z.infer<typeof UpdatePlantSchema>;
