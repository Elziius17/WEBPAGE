import type { Permission } from "@/lib/security/permissions";

export type AdminNavItem = { href: string; label: string; icon: string; permission: Permission };

export const adminNav: { group: string; items: AdminNavItem[] }[] = [
  {
    group: "General",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: "layout-dashboard",
        permission: "dashboard:view",
      },
    ],
  },
  {
    group: "Servicio técnico",
    items: [
      {
        href: "/admin/ordenes",
        label: "Órdenes de servicio",
        icon: "wrench",
        permission: "service-orders:read",
      },
      {
        href: "/admin/solicitudes",
        label: "Solicitudes",
        icon: "inbox",
        permission: "requests:read",
      },
      {
        href: "/admin/servicios",
        label: "Catálogo de servicios",
        icon: "list-checks",
        permission: "services:write",
      },
    ],
  },
  {
    group: "Comercial",
    items: [
      { href: "/admin/pedidos", label: "Pedidos", icon: "shopping-bag", permission: "orders:read" },
      { href: "/admin/entregas", label: "Entregas", icon: "truck", permission: "deliveries:write" },
      {
        href: "/admin/productos",
        label: "Productos",
        icon: "package",
        permission: "products:read",
      },
      {
        href: "/admin/inventario",
        label: "Inventario",
        icon: "boxes",
        permission: "inventory:read",
      },
      { href: "/admin/clientes", label: "Clientes", icon: "users", permission: "customers:read" },
    ],
  },
  {
    group: "Administración",
    items: [
      {
        href: "/admin/usuarios",
        label: "Usuarios y roles",
        icon: "shield",
        permission: "users:manage",
      },
      {
        href: "/admin/configuracion",
        label: "Configuración",
        icon: "settings",
        permission: "settings:write",
      },
      {
        href: "/admin/auditoria",
        label: "Auditoría",
        icon: "scroll-text",
        permission: "audit:read",
      },
    ],
  },
];
