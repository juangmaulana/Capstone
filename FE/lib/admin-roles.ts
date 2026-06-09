/**
 * Single source of truth for which roles may use the admin system.
 *
 * `ranger` and `visitor` are intentionally excluded — they must never receive
 * an admin session. This is enforced server-side at login (so no session/cookie
 * is created for them) and again on the client gate.
 */
export const canAccessAdminSystem = (role?: string): boolean => {
  const normalized = role?.trim().toLowerCase();
  return (
    normalized === "super admin" ||
    normalized === "admin" ||
    normalized === "researcher"
  );
};
