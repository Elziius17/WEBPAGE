import type { RoleKey } from "@/generated/prisma/enums";

/**
 * Catálogo de permisos. Fuente de verdad para la autorización en servidor.
 * El seed sincroniza estas definiciones con las tablas Permission/RolePermission
 * para fines de consulta y documentación.
 */
export const PERMISSIONS = {
  "dashboard:view": "Ver el panel y sus indicadores",
  "products:read": "Consultar productos",
  "products:write": "Crear y editar productos",
  "products:delete": "Eliminar productos",
  "inventory:read": "Consultar inventario y movimientos",
  "inventory:write": "Registrar entradas, salidas y ajustes",
  "suppliers:write": "Gestionar proveedores",
  "services:write": "Gestionar el catálogo de servicios",
  "orders:read": "Consultar pedidos",
  "orders:write": "Confirmar y actualizar pedidos",
  "deliveries:write": "Gestionar entregas y envíos",
  "customers:read": "Consultar clientes",
  "customers:write": "Crear y editar clientes",
  "requests:read": "Consultar solicitudes entrantes",
  "requests:write": "Atender solicitudes entrantes",
  "service-orders:read": "Consultar órdenes de servicio",
  "service-orders:read-all": "Consultar todas las órdenes (no solo asignadas)",
  "service-orders:write": "Crear y actualizar órdenes de servicio",
  "service-orders:assign": "Asignar técnicos",
  "users:manage": "Gestionar usuarios y roles",
  "settings:write": "Modificar configuración del negocio",
  "audit:read": "Consultar el registro de auditoría",
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as Permission[];

export const ROLE_PERMISSIONS: Record<RoleKey, readonly Permission[]> = {
  ADMIN: ALL,
  TECHNICIAN: [
    "dashboard:view",
    "products:read",
    "inventory:read",
    "service-orders:read",
    "service-orders:write",
    "customers:read",
  ],
  SALES: [
    "dashboard:view",
    "products:read",
    "products:write",
    "inventory:read",
    "inventory:write",
    "orders:read",
    "orders:write",
    "deliveries:write",
    "customers:read",
    "customers:write",
    "requests:read",
    "requests:write",
    "service-orders:read",
    "service-orders:read-all",
  ],
  CUSTOMER: [],
};

export const STAFF_ROLES: readonly RoleKey[] = ["ADMIN", "TECHNICIAN", "SALES"];

export function hasPermission(role: RoleKey | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function isStaff(role: RoleKey | null | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role);
}
