export type Role = "admin" | "operator" | "viewer";

export type Permission = "create" | "read" | "update" | "delete";

export const roles: Record<Role, Permission[]> = {
  admin: ["create", "read", "update", "delete"],
  operator: ["read", "update"],
  viewer: ["read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const allowed = roles[role]?.includes(permission) ?? false;
  // RBAC audit log – keeps track of access decisions
  // eslint-disable-next-line no-console
  console.log(
    `[RBAC] ${role} attempted ${permission}: ${
      allowed ? "ALLOWED" : "DENIED"
    }`,
  );
  return allowed;
}

