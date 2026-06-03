import { Generated, Insertable, Kysely, Selectable, Updateable } from "kysely";

export type DB = Kysely<Database>;

export interface UserTable {
  readonly id: Generated<number>
  role_id: number
  name: string
  email: string
  password: string
  readonly created_at: Generated<Date>
  readonly updated_at: Generated<Date>
  last_login_at?: Date | null
}
export type UserSelect = Selectable<UserTable>
export type UserInsert = Insertable<UserTable>
export type UserUpdate = Updateable<UserTable>

export interface RoleTable {
  readonly id: Generated<number>
  name: string
  description: string
}
export type RoleSelect = Selectable<RoleTable>

export interface PlantTable {
  readonly id: Generated<number>
  common_name: string
  scientific_name: string
  kingdom: string
  phylum: string
  class: string
  order: string
  family: string
  genus: string
  species: string
  botanical_description: string
  ecological_information: string
  environmental_impact: string
  source_reference: string
  image_path: string
  image_reference: string
  is_detectable: boolean
  readonly created_at: Generated<Date>
  readonly updated_at: Generated<Date>
}
export type PlantSelect = Selectable<PlantTable>
export type PlantInsert = Insertable<PlantTable>
export type PlantUpdate = Updateable<PlantTable>

export interface IdentificationTable {
  readonly id: Generated<number>
  plant_id: number
  image_id: number
  confidence: number
  ai_response: string
  is_success: boolean
  identified_at: Generated<Date>
}
export type IdentificationSelect = Selectable<IdentificationTable>

export interface ImageTable {
  readonly id: Generated<number>
  user_id: number
  identification_id: number
  file_name: string
  file_path: string
  file_size: number
  latitude: number
  longitude: number
  elevation: number
  uploaded_at: Generated<Date>
}
export type ImageSelect = Selectable<ImageTable>

export interface Database {
  users: UserTable
  roles: RoleTable
  plants: PlantTable
  identifications: IdentificationTable
  images: ImageTable
}
