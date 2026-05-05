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
  image_path: string
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
  identificationId: number
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
  expires_at: Generated<Date>
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