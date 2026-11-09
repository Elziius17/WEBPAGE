# Base de datos

PostgreSQL 16 con Prisma 7. El esquema está en `prisma/schema.prisma` y las migraciones en `prisma/migrations`.

## Convenciones

- Claves primarias `cuid()`; las tablas de Better Auth usan IDs generados por la librería.
- `createdAt` y `updatedAt` en todas las entidades mutables.
- Eliminación lógica (`deletedAt`) en `Product`, `Category`, `Service` y `Customer`.
- Montos en **céntimos de PEN** (`Int`).
- Fechas en UTC; se presentan y agregan en `America/Lima`.
- Marca `isDemo` para datos de demostración.

## Entidades

| Dominio          | Modelos                                                                                                                                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identidad y RBAC | `User`, `Session`, `Account`, `Verification`, `RateLimit`, `Role`, `Permission`, `RolePermission`                                                                                         |
| Personas         | `Customer`, `Technician`, `Address`                                                                                                                                                       |
| Catálogo         | `Category` (jerárquica), `Product`, `ProductImage`, `Supplier`                                                                                                                            |
| Inventario       | `InventoryMovement` (ENTRY, EXIT, ADJUSTMENT, RESERVATION, RELEASE, SALE, RETURN, SERVICE_USE)                                                                                            |
| Comercio         | `Order`, `OrderItem` (instantánea de precio y nombre), `OrderHistory`, `Payment`                                                                                                          |
| Entregas         | `Delivery`, `Courier`, `DeliveryZone`, `ShipmentTracking`                                                                                                                                 |
| Servicio técnico | `Service`, `ServiceRequest`, `ServiceOrder`, `ServiceOrderHistory`, `Diagnosis`, `ServiceApproval`, `RepairTask`, `ReplacementPart`, `QualityChecklist`, `QualityCheckItem`, `Attachment` |
| Transversal      | `Notification`, `Testimonial`, `AuditLog`, `BusinessConfiguration`                                                                                                                        |

## Relaciones clave

```
User 1─0..1 Customer 1─* Order 1─* OrderItem *─1 Product
                           Order 1─0..1 Delivery *─0..1 Courier / DeliveryZone / Address
                           Order 1─* Payment
Customer 1─* ServiceOrder 1─* (History, Diagnosis, ServiceApproval, RepairTask, ReplacementPart, QualityChecklist, Attachment)
Product 1─* InventoryMovement *─0..1 (Order | ServiceOrder | Supplier | User)
```

## Integridad

Restricciones `CHECK` añadidas en la migración inicial:

- `Product.stock >= 0`, `reserved >= 0`, `reserved <= stock`, `priceCents > 0`
- `OrderItem.quantity > 0`, montos de pedido `>= 0`
- `InventoryMovement.stockAfter/reservedAfter >= 0`
- `Testimonial.rating BETWEEN 1 AND 5`

Índices en códigos (`unique`), slugs, estados, fechas y claves foráneas frecuentes.

## Transacciones

- **Crear pedido**: bloquea cada producto (`FOR UPDATE`, en orden estable por ID para evitar interbloqueos), verifica stock y precio, y crea pedido, ítems, pago pendiente y entrega.
- **Confirmar**: vuelve a verificar y reserva. **Completar**: convierte la reserva en venta. **Cancelar**: libera.
- **Repuesto desde inventario**: movimiento `SERVICE_USE` en la misma transacción que el registro del repuesto.

## Seed

`npm run db:seed` es idempotente y crea:

1. Roles y permisos (sincronizados desde el código).
2. El administrador (`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).
3. Los 7 servicios oficiales, las 14 categorías y el checklist de calidad.
4. Si `SEED_DEMO_DATA=true`: productos, zona, courier, usuarios técnico y ventas, y testimonio, todos marcados **[DEMO]**.

## Operaciones

Nueva migración en desarrollo:

```bash
npx prisma migrate dev --name descripcion
```

Aplicar migraciones en producción:

```bash
npm run db:deploy
```

Explorar los datos:

```bash
npx prisma studio
```
