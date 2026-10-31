export const APP_ROLES = ['student', 'trainer', 'faculty', 'admin']

export function isAppRole(role) {
  return APP_ROLES.includes(role)
}
