export const protocols = [
  {
    code: "01",
    slug: "recepcion",
    title: "Recepción",
    icon: "clipboard-list",
    summary:
      "Registramos tu equipo con detalle para garantizar trazabilidad desde el primer minuto.",
    steps: [
      { t: "Registro del cliente", d: "Datos de contacto y medio de comunicación preferido." },
      { t: "Identificación del equipo", d: "Tipo, marca, modelo y número de serie." },
      { t: "Inspección física", d: "Estado externo: golpes, rayones, piezas faltantes." },
      { t: "Registro de accesorios", d: "Cargador, cables, maletín u otros elementos entregados." },
      { t: "Registro fotográfico", d: "Evidencia visual del estado en que se recibe el equipo." },
      { t: "Generación de orden", d: "Orden de servicio con código único de seguimiento." },
    ],
  },
  {
    code: "02",
    slug: "diagnostico",
    title: "Diagnóstico",
    icon: "scan-search",
    summary: "Identificamos la causa real de la falla antes de proponer cualquier intervención.",
    steps: [
      { t: "Evaluación", d: "Revisión del problema reportado y del funcionamiento general." },
      { t: "Identificación de fallas", d: "Determinación de componentes o software afectados." },
      { t: "Pruebas", d: "Pruebas de hardware y software documentadas." },
      { t: "Presupuesto", d: "Detalle del trabajo, repuestos y tiempo estimado." },
      { t: "Comunicación al cliente", d: "Explicación clara del diagnóstico y opciones." },
      { t: "Autorización", d: "Registro de la aprobación o rechazo del cliente." },
    ],
  },
  {
    code: "03",
    slug: "reparacion",
    title: "Reparación",
    icon: "wrench",
    summary: "Ejecutamos solo el trabajo autorizado, con cuidado y documentación de cada paso.",
    steps: [
      { t: "Preparación", d: "Área de trabajo limpia y herramientas adecuadas." },
      { t: "Intervención", d: "Ejecución del servicio aprobado por el cliente." },
      { t: "Protección de componentes", d: "Medidas antiestáticas y manipulación segura." },
      { t: "Registro de repuestos", d: "Cada pieza reemplazada queda registrada en la orden." },
      { t: "Documentación", d: "Actividades realizadas y observaciones técnicas." },
    ],
  },
  {
    code: "04",
    slug: "control-de-calidad",
    title: "Control de calidad",
    icon: "badge-check",
    summary: "Ningún equipo se entrega sin superar nuestro checklist de pruebas.",
    steps: [
      { t: "Pruebas de funcionamiento", d: "Encendido, arranque y operación general." },
      { t: "Estabilidad", d: "Uso sostenido sin bloqueos ni reinicios." },
      { t: "Temperaturas", d: "Valores dentro de rangos normales de operación." },
      { t: "Conectividad", d: "Red, puertos y periféricos." },
      { t: "Validación del servicio", d: "Confirmación de que el problema reportado se resolvió." },
    ],
  },
  {
    code: "05",
    slug: "entrega",
    title: "Entrega",
    icon: "package-check",
    summary: "Te entregamos tu equipo con información clara sobre lo realizado.",
    steps: [
      { t: "Comunicación", d: "Aviso de que el equipo está listo y coordinación de entrega." },
      {
        t: "Presentación de resultados",
        d: "Resumen del trabajo realizado y repuestos utilizados.",
      },
      { t: "Recomendaciones", d: "Buenas prácticas de uso y mantenimiento." },
      { t: "Garantía", d: "Condiciones y plazo de la garantía aplicable." },
      { t: "Conformidad", d: "Registro de la conformidad del cliente." },
    ],
  },
  {
    code: "06",
    slug: "proteccion-de-datos",
    title: "Protección de datos",
    icon: "lock",
    summary: "Tu información es tuya. La tratamos con confidencialidad y solo con autorización.",
    steps: [
      {
        t: "Confidencialidad",
        d: "El personal no revisa ni copia información personal del equipo.",
      },
      {
        t: "Autorización de acceso",
        d: "Solo se accede al sistema cuando el servicio lo requiere y el cliente lo autoriza.",
      },
      {
        t: "Respaldos autorizados",
        d: "Las copias de seguridad se realizan únicamente con autorización expresa.",
      },
      {
        t: "Protección de información",
        d: "No almacenamos contraseñas de equipos en nuestros sistemas.",
      },
      {
        t: "Eliminación segura",
        d: "Borrado seguro de datos solo cuando corresponde y existe autorización.",
      },
    ],
  },
] as const;
