export const Permission = {
  // Órdenes
  CREATE_ORDER: 'CREATE_ORDER',
  CANCEL_ORDER: 'CANCEL_ORDER',
  TRACK_ORDER: 'TRACK_ORDER',
  MANAGE_ORDERS: 'MANAGE_ORDERS',
  ASSIGN_DRIVER: 'ASSIGN_DRIVER',

  // Organización
  APPROVE_ORG: 'APPROVE_ORG',
  MANAGE_ORG_USERS: 'MANAGE_ORG_USERS',
  VIEW_ORG: 'VIEW_ORG',

  // Usuarios internos
  MANAGE_USERS: 'MANAGE_USERS',
  MANAGE_OPERATORS: 'MANAGE_OPERATORS',

  // Camiones
  MANAGE_TRUCKS: 'MANAGE_TRUCKS',

  // Auditoría
  VIEW_AUDIT: 'VIEW_AUDIT',

  // Conductor
  VIEW_ASSIGNED_ORDERS: 'VIEW_ASSIGNED_ORDERS',
  UPDATE_ORDER_STATUS: 'UPDATE_ORDER_STATUS',
} as const

export type PermissionKey = keyof typeof Permission
export type PermissionValue = (typeof Permission)[PermissionKey]

export const ROLE_PERMISSIONS: Record<string, PermissionValue[] | ['*']> = {
  ADMIN: ['*'],
  OPERATOR: [
    Permission.VIEW_ORG,
    Permission.APPROVE_ORG,
    Permission.MANAGE_ORDERS,
    Permission.ASSIGN_DRIVER,
    Permission.MANAGE_TRUCKS,
    Permission.VIEW_AUDIT,
  ],
  ORG_ADMIN: [
    Permission.CREATE_ORDER,
    Permission.CANCEL_ORDER,
    Permission.TRACK_ORDER,
    Permission.MANAGE_ORG_USERS,
    Permission.VIEW_ORG,
  ],
  ORG_ORDER: [Permission.CREATE_ORDER, Permission.CANCEL_ORDER, Permission.TRACK_ORDER],
  ORG_TRACK: [Permission.TRACK_ORDER],
  DRIVER: [Permission.VIEW_ASSIGNED_ORDERS, Permission.UPDATE_ORDER_STATUS],
}

export function hasPermission(role: string, permission: PermissionValue): boolean {
  const permissions = ROLE_PERMISSIONS[role]
  if (!permissions) return false
  if (permissions[0] === '*') return true
  return (permissions as PermissionValue[]).includes(permission)
}
