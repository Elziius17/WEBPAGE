# Guía de usuario (personal ELZIIUS)

Accede en `/login` y luego a `/admin`. Lo que ves depende de tu rol:

| Rol           | Puede                                                                                  |
| ------------- | -------------------------------------------------------------------------------------- |
| Administrador | Todo, incluidos usuarios, configuración y auditoría                                    |
| Ventas        | Productos, inventario, pedidos, entregas, clientes y solicitudes; ver órdenes técnicas |
| Técnico       | Órdenes de servicio asignadas: diagnóstico, reparación y control de calidad            |
| Cliente       | Solo `/mi-cuenta` con sus pedidos y equipos                                            |

## Primeros pasos (administrador)

1. **Configuración**: nombre comercial, RUC, **WhatsApp** (p. ej. `51987654321`), teléfono, correo, dirección, horario, instrucciones de recojo y garantía por defecto.
2. **Usuarios y roles**: crea las cuentas de técnicos y vendedores.
3. **Entregas › Couriers y zonas**: registra tus couriers y zonas con los costos que realmente cobras (o déjalos sin costo para cotizar caso a caso).
4. **Productos**: reemplaza los productos `[DEMO]` por productos reales y sube sus fotos.
5. **Inventario**: registra el stock inicial como **Entrada**, con proveedor y costo.

## Atender un equipo (orden de servicio)

1. **Órdenes › Registrar recepción**: cliente, equipo, accesorios, estado físico y problema. Se genera el código `EZ-XXXX-XXXX`. Entrégalo al cliente junto con el **PDF**.
2. Adjunta **fotografías de recepción**.
3. **Diagnóstico**: fallas, pruebas, diagnóstico técnico y un **resumen visible para el cliente**.
4. **Presupuesto**: registra el monto y el medio de envío.
5. **Respuesta del cliente**: marca aprobado o rechazado con la **evidencia** (p. ej. "Confirmó por WhatsApp 15:20"). Sin aprobación, el sistema no permite reparar.
6. **Ejecución**: registra las actividades y los repuestos. Si sale del inventario, marca "Descontar del inventario".
7. **Control de calidad**: completa el checklist. Si algún punto falla, no podrás marcar "Listo para entrega".
8. **Cierre y entrega**: resultado, garantía, recomendaciones y conformidad.
9. Usa **Notificar al cliente** para abrir WhatsApp con el estado y el enlace de seguimiento.

El cliente puede consultar su equipo en `/seguimiento` con su código y su correo o teléfono.

## Gestionar un pedido

1. Llega en estado **Pendiente de confirmación** (se avisa al cliente por WhatsApp).
2. Verifica la disponibilidad. Si es courier, ingresa el **costo de envío cotizado** y **Confirma**: el stock queda reservado.
3. Cuando el cliente pague, registra el **pago verificado** con el número de operación.
4. **Entrega**: en recojo, coordina el lugar y la hora, pasa a "Listo para recojo" y luego a "Entregado". En courier, asigna el courier, registra la guía, el peso y las dimensiones, y pasa a "Despachado" → "En tránsito" → "Entregado".
5. Al marcar **Entregado**, el pedido se completa y el stock se descuenta automáticamente.
6. **Cancelar** libera las reservas.

## Inventario

- **Entrada**: compras a proveedores (registra el costo unitario).
- **Salida**: mermas o uso interno (no puede superar lo disponible).
- **Ajuste**: corrige el conteo físico total; el **motivo es obligatorio**.
- Las alertas aparecen cuando lo disponible es menor o igual al **stock mínimo**.

## Solicitudes

Revisa **Solicitudes** a diario: servicios, cotizaciones, consultas, contacto y **Libro de Reclamaciones**. Las reclamaciones deben responderse dentro del plazo legal.
