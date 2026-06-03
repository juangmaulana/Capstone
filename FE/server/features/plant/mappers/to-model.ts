import { PlantSelect } from '@/server/db/types';
import { Plant } from '../model';

export const toModel = (row: PlantSelect): Plant => {
  return {
    id: row.id,
    commonName: row.common_name,
    scientificName: row.scientific_name,
    kingdom: row.kingdom,
    phylum: row.phylum,
    class: row.class,
    order: row.order,
    family: row.family,
    genus: row.genus,
    species: row.species,
    botanicalDescription: row.botanical_description,
    ecologicalInformation: row.ecological_information,
    environmentalImpact: row.environmental_impact,
    sourceReference: row.source_reference,
    imagePath: row.image_path,
    imageReference: row.image_reference,
    isDetectable: row.is_detectable,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const toModelOrNull = (
  row: PlantSelect | undefined
): Plant | null => {
  return row ? toModel(row) : null
}
