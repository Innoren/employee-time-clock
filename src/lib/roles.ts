export const ROLES = ["employee", "supervisor", "admin"] as const;
export type Role = (typeof ROLES)[number];

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function parseRole(value: unknown): Role {
  return isRole(value) ? value : "employee";
}

export function canViewTimesheets(role: Role) {
  return role === "supervisor" || role === "admin";
}

export function canManageTeam(role: Role) {
  return role === "admin";
}

export function roleLabel(role: Role) {
  switch (role) {
    case "admin":
      return "Admin";
    case "supervisor":
      return "Supervisor";
    default:
      return "Employee";
  }
}

export function homePath(role: Role) {
  return canViewTimesheets(role) ? "/admin" : "/clock";
}
