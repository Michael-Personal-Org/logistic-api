export const UserRole = {
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  DRIVER: 'DRIVER',
  ORG_ADMIN: 'ORG_ADMIN',
  ORG_ORDER: 'ORG_ORDER',
  ORG_TRACK: 'ORG_TRACK',
} as const

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole]

export const ROLES = UserRole
export type Role = UserRoleType

// Roles internos (sin organización)
export const INTERNAL_ROLES = [UserRole.ADMIN, UserRole.OPERATOR, UserRole.DRIVER]

// Roles de organización cliente
export const ORG_ROLES = [UserRole.ORG_ADMIN, UserRole.ORG_ORDER, UserRole.ORG_TRACK]

// Roles que pueden gestionar usuarios
export const USER_MANAGER_ROLES = [UserRole.ADMIN, UserRole.OPERATOR, UserRole.ORG_ADMIN]
