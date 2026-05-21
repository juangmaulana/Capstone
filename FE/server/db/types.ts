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
  readonly created_at: Generated<Date>
  readonly updated_at: Generated<Date>
}
export type RoleSelect = Selectable<RoleTable>
export type RoleInsert = Insertable<RoleTable> 
export type RoleUpdate = Updateable<RoleTable>

export interface PlantTable {
  readonly id: Generated<number>
  common_name: string
  scientific_name: string
  family: string
  genus: string
  botanical_description: string
  ecological_information: string
  environmental_impact: string
  botanical_description_en: string
  botanical_description_id: string
  ecological_information_en: string
  ecological_information_id: string
  environmental_impact_en: string
  environmental_impact_id: string
  image_path: string
  kingdom: string
  phylum: string
  tax_class: string
  order_rank: string
  tax_species: string
  source: string
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
  uploaded_at: Generated<Date>
}
export type ImageSelect = Selectable<ImageTable>

export interface SessionTable {
  readonly id: string
  user_id: number
  expires_at: Date
  readonly created_at: Generated<Date>
}
export type SessionSelect = Selectable<SessionTable>
export type SessionInsert = Insertable<SessionTable>

export interface Database {
  users: UserTable
  roles: RoleTable
  plants: PlantTable
  identifications: IdentificationTable
  images: ImageTable
  sessions: SessionTable
}
