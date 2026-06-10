export type SystemRole = "admin" | "ranger" | "visitor" | "unknown";

export const normalizeSystemRole = (role?: string): SystemRole => {
  const normalized = role?.trim().toLowerCase();

  if (normalized === "super admin" || normalized === "admin") return "admin";
  if (normalized === "field officer" || normalized === "ranger") return "ranger";
  if (normalized === "researcher" || normalized === "user" || normalized === "visitor") return "visitor";
  return "unknown";
};

export const canAccessAdminSystem = (role?: string): boolean => {
  const normalized = normalizeSystemRole(role);
  return normalized === "admin" || normalized === "ranger";
};

export const canManageUsers = (role?: string): boolean =>
  normalizeSystemRole(role) === "admin";

export const canCreatePlants = (role?: string): boolean => {
  const normalized = normalizeSystemRole(role);
  return normalized === "admin" || normalized === "ranger";
};

export const canUpdatePlants = (role?: string): boolean =>
  normalizeSystemRole(role) === "admin";

export const canDeletePlants = (role?: string): boolean =>
  normalizeSystemRole(role) === "admin";

export const canValidateIdentification = (role?: string): boolean =>
  normalizeSystemRole(role) === "admin";

export const canSaveIdentificationNotes = (role?: string): boolean => {
  const normalized = normalizeSystemRole(role);
  return normalized === "admin" || normalized === "ranger";
};
