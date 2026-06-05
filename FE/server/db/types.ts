import { Generated, Insertable, Kysely, Selectable, Updateable } from "kysely";

export type DB = Kysely<Database>;

export interface UserTable {
  readonly id: Generated<number>
  role_id: number
  name: string
  email: string
  password_hash: string
  last_login_at: Date | null
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
  ranger_id: number | null
  uploaded_by: number | null
  readonly identified_at: Generated<Date>
}

export interface ImageTable {
  readonly id: Generated<number>
  file_name: string
  file_path: string
  file_size: number
  latitude: number
  longitude: number
  elevation: number
  readonly uploaded_at: Generated<Date>
}

export interface AuditLogTable {
  id: string
  actor_id: string
  entity_id: string
  entity_type: string
  action: string
  message: string
  readonly created_at: Generated<Date>
}
export type AuditLogSelect = Selectable<AuditLogTable>
export type AuditLogInsert = Insertable<AuditLogTable>

export interface Database {
  users: UserTable
  roles: RoleTable
  plants: PlantTable
  identifications: IdentificationTable
  images: ImageTable
  audit_logs: AuditLogTable
}

export interface UserWithRole {
  id: Generated<number>;
  role_id: number;
  role_name: string;
  name: string;
  email: string;
  password_hash: string;
  last_login_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}
export type UserWithRoleSelect = Selectable<UserWithRole>;

export interface EnrichedIdentification {
  readonly id: number
  confidence: number
  ai_response: string
  is_success: boolean

  image_id: number | null
  image_name: string | null
  image_path: string | null
  image_size: number | null
  image_latitude: number | null
  image_longitude: number | null
  image_elevation: number | null
  image_uploaded_at: Date | null

  plant_id: number | null
  plant_name: string | null
  scientific_name: string | null

  ranger_id: number | null
  ranger_name: string | null

  uploader_id: number | null
  uploader_name: string | null

  readonly identified_at: Generated<Date>
}
export type EnrichedIdentificationSelect = Selectable<EnrichedIdentification>;