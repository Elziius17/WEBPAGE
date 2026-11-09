/** Contenido institucional estático (editable en código). */

export const benefits = [
  {
    icon: "scan-search",
    title: "Diagnóstico transparente",
    text: "Te explicamos la falla y el presupuesto antes de intervenir. Nada se repara sin tu autorización registrada.",
  },
  {
    icon: "radar",
    title: "Seguimiento en línea",
    text: "Consulta el estado de tu equipo en cualquier momento con tu código de orden.",
  },
  {
    icon: "shield-check",
    title: "Protección de tus datos",
    text: "Protocolos de confidencialidad: solo accedemos a tu información con autorización.",
  },
  {
    icon: "badge-check",
    title: "Control de calidad",
    text: "Cada equipo pasa un checklist de pruebas antes de ser entregado.",
  },
  {
    icon: "cpu",
    title: "Componentes con garantía",
    text: "Asesoría de compatibilidad y productos con garantía especificada en cada ficha.",
  },
  {
    icon: "truck",
    title: "Recojo o envío",
    text: "Coordina el recojo presencial o el envío por courier según tu ubicación.",
  },
] as const;

export const techProcess = [
  {
    title: "Solicitud y recepción",
    text: "Registramos tu equipo, accesorios y estado físico. Recibes tu código de seguimiento.",
  },
  {
    title: "Diagnóstico",
    text: "Evaluamos el equipo, realizamos pruebas e identificamos las fallas.",
  },
  {
    title: "Presupuesto y aprobación",
    text: "Te enviamos el presupuesto. Tú decides si apruebas el servicio.",
  },
  {
    title: "Reparación",
    text: "Ejecutamos únicamente el trabajo autorizado y registramos cada repuesto.",
  },
  {
    title: "Control de calidad",
    text: "Probamos encendido, temperaturas, almacenamiento, conectividad y estabilidad.",
  },
  { title: "Entrega", text: "Coordinamos la entrega con recomendaciones y garantía aplicable." },
] as const;

export const purchaseProcess = [
  {
    title: "Elige tus productos",
    text: "Explora la tienda, compara especificaciones y agrega al carrito.",
  },
  {
    title: "Registra tu pedido",
    text: "Indica tus datos y si prefieres recojo presencial o envío por courier.",
  },
  {
    title: "Confirmamos disponibilidad",
    text: "Verificamos stock y coordinamos contigo pago y entrega por WhatsApp.",
  },
  {
    title: "Recibe tu compra",
    text: "Recoge en el punto acordado o recibe tu envío con número de guía.",
  },
] as const;

export const faqs = [
  {
    q: "¿Cómo consulto el estado de mi equipo?",
    a: "Ingresa a la sección Seguimiento con el código de orden que te entregamos al recibir tu equipo y el correo o teléfono que registraste.",
  },
  {
    q: "¿Repararán mi equipo sin consultarme?",
    a: "No. Primero realizamos el diagnóstico y te enviamos un presupuesto. Solo ejecutamos el servicio que autorizas, y la autorización queda registrada en tu orden.",
  },
  {
    q: "¿Qué pasa con la información de mi computadora?",
    a: "Aplicamos un protocolo de protección de datos: no accedemos a tus archivos salvo que sea necesario para el servicio y lo autorices. Los respaldos se realizan solo con tu autorización.",
  },
  {
    q: "¿Cómo compro un producto de la tienda?",
    a: "Agrega los productos al carrito y registra tu pedido. Verificamos el stock y te contactamos para coordinar el pago y la entrega. No se realizan cobros automáticos en la web.",
  },
  {
    q: "¿Hacen envíos?",
    a: "Sí, coordinamos envíos mediante courier. El costo del envío se cotiza según destino, peso y dimensiones antes de confirmar tu pedido.",
  },
  {
    q: "¿Los productos tienen garantía?",
    a: "Sí. Cada producto indica su periodo de garantía en la ficha. Revisa nuestra Política de garantías para conocer las condiciones.",
  },
  {
    q: "¿Atienden a empresas?",
    a: "Sí. Ofrecemos planes de mantenimiento, soporte a usuarios, inventario informático y asesoramiento tecnológico para empresas.",
  },
] as const;
