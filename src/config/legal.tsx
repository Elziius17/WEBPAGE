import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Documentos legales BASE para ELZIIUS.
 * IMPORTANTE: Son borradores preparados para revisión por un abogado. No constituyen
 * asesoría jurídica definitiva. Antes de publicarlos, completar los datos marcados
 * entre corchetes [ ] y validar su conformidad con la normativa vigente.
 */
export type LegalDoc = { slug: string; title: string; description: string; updated: string; body: ReactNode };

const UPDATED = "9 de noviembre de 2026";

export const legalDocs: LegalDoc[] = [
  {
    slug: "privacidad",
    title: "Política de privacidad y protección de datos personales",
    description: "Cómo ELZIIUS recopila, usa y protege tus datos personales conforme a la Ley N.º 29733.",
    updated: UPDATED,
    body: (
      <>
        <p>
          En ELZIIUS (en adelante, “ELZIIUS”) respetamos tu privacidad. Esta política explica cómo tratamos tus datos
          personales conforme a la Ley N.º 29733, Ley de Protección de Datos Personales, y su Reglamento vigente
          (aprobado por Decreto Supremo N.º 016-2024-JUS), así como las disposiciones de la Autoridad Nacional de
          Protección de Datos Personales.
        </p>
        <h2>1. Titular del banco de datos</h2>
        <p>
          Responsable del tratamiento: [RAZÓN SOCIAL / NOMBRE DEL TITULAR], con RUC [N.º DE RUC] y domicilio en
          [DIRECCIÓN]. Correo de contacto para asuntos de privacidad: [CORREO]. Banco de datos inscrito ante el
          Registro Nacional de Protección de Datos Personales: [CÓDIGO DE INSCRIPCIÓN, cuando corresponda].
        </p>
        <h2>2. Datos que recopilamos</h2>
        <ul>
          <li>Datos de identificación y contacto: nombre, documento de identidad, teléfono, correo y dirección.</li>
          <li>Datos de compras y pedidos: productos, montos, modalidad de entrega y comprobantes.</li>
          <li>Datos del servicio técnico: tipo, marca, modelo y número de serie del equipo, falla reportada, diagnósticos y fotografías del equipo.</li>
          <li>Datos técnicos de navegación estrictamente necesarios para la seguridad del sitio (por ejemplo, dirección IP de forma seudonimizada).</li>
        </ul>
        <p>No almacenamos datos de tarjetas bancarias ni contraseñas de tus equipos.</p>
        <h2>3. Finalidades</h2>
        <ul>
          <li>Atender solicitudes de servicio, cotizaciones y consultas.</li>
          <li>Gestionar pedidos, entregas, garantías y comprobantes de pago.</li>
          <li>Registrar órdenes de servicio y permitir su seguimiento en línea.</li>
          <li>Cumplir obligaciones legales, tributarias y de atención de reclamos.</li>
          <li>Finalidades adicionales (como envío de promociones) solo con tu consentimiento previo, libre, expreso e informado, que podrás revocar en cualquier momento.</li>
        </ul>
        <h2>4. Base legal y consentimiento</h2>
        <p>
          Tratamos tus datos con tu consentimiento, otorgado al marcar la casilla correspondiente en nuestros
          formularios, y cuando sea necesario para ejecutar la relación contractual o cumplir obligaciones legales.
        </p>
        <h2>5. Destinatarios y transferencias</h2>
        <p>
          Podremos compartir los datos estrictamente necesarios con empresas de courier para la entrega de pedidos y
          con proveedores de servicios tecnológicos (alojamiento, almacenamiento) que actúan como encargados del
          tratamiento bajo obligaciones de confidencialidad. [Detallar proveedores y, de existir, flujos
          transfronterizos.]
        </p>
        <h2>6. Plazo de conservación</h2>
        <p>
          Conservaremos los datos mientras dure la relación comercial y durante los plazos exigidos por la normativa
          aplicable (por ejemplo, tributaria y de protección al consumidor). [Precisar plazos.]
        </p>
        <h2>7. Seguridad</h2>
        <p>
          Aplicamos medidas técnicas, organizativas y legales: cifrado en tránsito (HTTPS), contraseñas almacenadas
          mediante funciones de hash seguras, control de acceso por roles, registros de auditoría y principio de
          mínimo privilegio.
        </p>
        <h2>8. Tus derechos (ARCO y otros)</h2>
        <p>
          Puedes ejercer tus derechos de acceso, rectificación, cancelación, oposición, información y demás
          reconocidos por la ley escribiendo a [CORREO] con copia de tu documento de identidad. Atenderemos tu
          solicitud en los plazos legales. Si consideras que no fue atendida, puedes acudir a la Autoridad Nacional de
          Protección de Datos Personales.
        </p>
        <h2>9. Datos en equipos recibidos para servicio técnico</h2>
        <p>
          Solo accedemos a la información almacenada en tu equipo cuando el servicio lo requiere y lo autorizas. Los
          respaldos y eliminaciones de datos se realizan únicamente con autorización expresa. Consulta nuestro{" "}
          <Link href="/protocolos#proteccion-de-datos">Protocolo de protección de datos</Link>.
        </p>
        <h2>10. Cambios a esta política</h2>
        <p>Publicaremos cualquier modificación en esta página indicando la fecha de actualización.</p>
      </>
    ),
  },
  {
    slug: "terminos",
    title: "Términos y condiciones",
    description: "Condiciones de uso del sitio web, compras y servicios de ELZIIUS.",
    updated: UPDATED,
    body: (
      <>
        <p>
          Estos términos regulan el uso del sitio web de ELZIIUS y la contratación de sus productos y servicios, de
          conformidad con la Ley N.º 29571, Código de Protección y Defensa del Consumidor, y demás normas aplicables
          en el Perú.
        </p>
        <h2>1. Identificación del proveedor</h2>
        <p>[RAZÓN SOCIAL / NOMBRE DEL TITULAR], RUC [N.º], domicilio en [DIRECCIÓN], correo [CORREO].</p>
        <h2>2. Pedidos de productos</h2>
        <ul>
          <li>Los precios se expresan en soles (PEN). [Indicar si incluyen IGV.]</li>
          <li>Registrar un pedido en la web no implica un cobro. ELZIIUS verificará el stock y coordinará contigo la confirmación, el pago y la entrega.</li>
          <li>El pedido se considera confirmado cuando ELZIIUS lo comunica expresamente y, de corresponder, se verifica el pago.</li>
          <li>Si un producto no estuviera disponible, te informaremos y podrás elegir otra alternativa o la anulación del pedido sin costo.</li>
        </ul>
        <h2>3. Pagos</h2>
        <p>
          Los medios de pago se coordinan directamente con ELZIIUS. El sitio no almacena datos de tarjetas. Solo se
          considera pagado un pedido cuando el pago ha sido verificado.
        </p>
        <h2>4. Servicios técnicos</h2>
        <ul>
          <li>Todo servicio inicia con la recepción del equipo y la emisión de una orden con código de seguimiento.</li>
          <li>Ninguna reparación se ejecuta sin la aprobación del presupuesto por parte del cliente.</li>
          <li>[Indicar si el diagnóstico tiene costo y en qué casos.]</li>
          <li>[Indicar el plazo para recoger equipos reparados o no reparados y las consecuencias del abandono, conforme a ley.]</li>
        </ul>
        <h2>5. Entregas</h2>
        <p>Consulta la <Link href="/legal/entregas">Política de entregas</Link>.</p>
        <h2>6. Garantías, cambios y devoluciones</h2>
        <p>
          Consulta la <Link href="/legal/garantias">Política de garantías</Link> y la{" "}
          <Link href="/legal/cambios-devoluciones">Política de cambios y devoluciones</Link>.
        </p>
        <h2>7. Cuentas de usuario</h2>
        <p>Eres responsable de mantener la confidencialidad de tu contraseña. ELZIIUS puede suspender cuentas usadas de forma fraudulenta.</p>
        <h2>8. Propiedad intelectual</h2>
        <p>La marca ELZIIUS, su logotipo y los contenidos del sitio son de titularidad de ELZIIUS o se usan con autorización.</p>
        <h2>9. Reclamos</h2>
        <p>Ponemos a tu disposición nuestro <Link href="/libro-de-reclamaciones">Libro de Reclamaciones virtual</Link>.</p>
        <h2>10. Legislación aplicable</h2>
        <p>Estos términos se rigen por las leyes de la República del Perú.</p>
      </>
    ),
  },
  {
    slug: "garantias",
    title: "Política de garantías",
    description: "Condiciones de garantía para productos y servicios técnicos de ELZIIUS.",
    updated: UPDATED,
    body: (
      <>
        <p>
          ELZIIUS respeta las garantías legales, explícitas e implícitas reconocidas por el Código de Protección y
          Defensa del Consumidor (Ley N.º 29571).
        </p>
        <h2>1. Productos</h2>
        <ul>
          <li>El plazo de garantía de cada producto se indica en su ficha y en el comprobante.</li>
          <li>La garantía cubre defectos de fabricación o funcionamiento en condiciones normales de uso.</li>
          <li>No cubre daños por mal uso, golpes, humedad, sobretensiones, manipulación por terceros o instalación indebida.</li>
          <li>Para hacerla efectiva, presenta el comprobante y el producto con sus accesorios. [Precisar si se requiere empaque original.]</li>
          <li>[Indicar si la garantía es gestionada por ELZIIUS, por el fabricante o por el distribuidor, y los plazos de evaluación.]</li>
        </ul>
        <h2>2. Servicios técnicos</h2>
        <ul>
          <li>Los servicios técnicos tienen la garantía indicada en la orden de servicio al momento de la entrega.</li>
          <li>La garantía del servicio cubre la falla reparada; no cubre fallas distintas ni nuevas averías.</li>
          <li>Los repuestos instalados tienen la garantía del fabricante o la indicada en la orden.</li>
        </ul>
        <h2>3. Procedimiento</h2>
        <p>
          Comunícate con nosotros indicando tu código de pedido u orden de servicio. Evaluaremos el caso y te
          informaremos la solución: reparación, reposición o la que corresponda según ley.
        </p>
      </>
    ),
  },
  {
    slug: "cambios-devoluciones",
    title: "Política de cambios y devoluciones",
    description: "Condiciones para cambios y devoluciones de productos adquiridos en ELZIIUS.",
    updated: UPDATED,
    body: (
      <>
        <p>
          Esta política complementa los derechos que te reconoce la Ley N.º 29571. Ninguna disposición aquí limita
          tus derechos como consumidor.
        </p>
        <h2>1. Cambios</h2>
        <ul>
          <li>Puedes solicitar el cambio de un producto dentro de [N.º] días calendario desde su entrega.</li>
          <li>El producto debe estar sin uso, completo, con accesorios, manuales y empaque en buen estado, y con su comprobante.</li>
          <li>[Indicar productos excluidos de cambio por razones de higiene, seguridad o licencias activadas, si corresponde.]</li>
        </ul>
        <h2>2. Devoluciones</h2>
        <ul>
          <li>Procede la devolución cuando el producto presenta defectos de fábrica no subsanables o no corresponde a lo ofrecido.</li>
          <li>[Indicar condiciones, plazos y medios para la devolución del dinero.]</li>
        </ul>
        <h2>3. Costos de envío</h2>
        <p>[Indicar quién asume los costos de envío en cambios y devoluciones según el motivo.]</p>
        <h2>4. Cómo solicitarlo</h2>
        <p>Escríbenos indicando tu código de pedido y el motivo. Te responderemos con los pasos a seguir.</p>
      </>
    ),
  },
  {
    slug: "entregas",
    title: "Política de entregas",
    description: "Modalidades de entrega: recojo presencial y envío mediante courier.",
    updated: UPDATED,
    body: (
      <>
        <h2>1. Modalidades</h2>
        <ul>
          <li><strong>Recojo presencial:</strong> coordinamos contigo el lugar y horario de recojo.</li>
          <li><strong>Envío por courier:</strong> despachamos a la dirección indicada mediante empresas de courier.</li>
        </ul>
        <h2>2. Costos y tiempos</h2>
        <p>
          El costo de envío se cotiza según destino, peso y dimensiones del paquete, y se informa antes de confirmar
          el pedido. Los tiempos de entrega dependen del courier y del destino; te los comunicaremos al confirmar.
          ELZIIUS no publica tarifas ni tiempos que no hayan sido confirmados.
        </p>
        <h2>3. Seguimiento</h2>
        <p>Al despachar tu pedido te compartiremos el nombre del courier y el número de guía para su seguimiento.</p>
        <h2>4. Recepción</h2>
        <ul>
          <li>Verifica el estado del paquete al recibirlo. Si presenta daños visibles, déjalo constar ante el courier y comunícate con nosotros.</li>
          <li>[Indicar política ante direcciones incorrectas, ausencia del destinatario y reprogramaciones.]</li>
        </ul>
        <h2>5. Incidencias</h2>
        <p>Ante cualquier incidencia con tu envío, contáctanos indicando tu código de pedido.</p>
      </>
    ),
  },
];
