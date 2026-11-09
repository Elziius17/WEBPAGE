import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Document, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import {
  deviceTypeLabel,
  serviceDeliveryModeLabel,
  serviceOrderStatusLabel,
  approvalDecisionLabel,
} from "@/config/statuses";
import { formatDateTime, formatDate } from "@/lib/utils/dates";
import { formatPEN } from "@/lib/utils/money";
import type { BusinessSettings } from "@/services/settings";

const NAVY = "#0B223F";
const CYAN = "#00A6D6";

const s = StyleSheet.create({
  page: { padding: 32, fontSize: 9, fontFamily: "Helvetica", color: "#1d2a3a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: NAVY,
    borderRadius: 6,
    padding: 12,
    marginBottom: 14,
  },
  logo: { width: 110, height: 60, objectFit: "contain" },
  hTitle: { color: "#fff", fontSize: 14, fontFamily: "Helvetica-Bold", textAlign: "right" },
  hCode: {
    color: "#66F0FF",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    marginTop: 3,
  },
  hMeta: { color: "#cfe0f2", fontSize: 8, textAlign: "right", marginTop: 3 },
  section: { marginBottom: 10, borderWidth: 1, borderColor: "#d8e1ec", borderRadius: 4 },
  sTitle: {
    backgroundColor: "#eef4fa",
    color: NAVY,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  body: { padding: 8 },
  row: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: "33.33%", marginBottom: 5, paddingRight: 6 },
  cell2: { width: "50%", marginBottom: 5, paddingRight: 6 },
  label: { fontSize: 7, color: "#5b6b80", textTransform: "uppercase", marginBottom: 1 },
  value: { fontSize: 9 },
  para: { fontSize: 9, lineHeight: 1.4 },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e3e9f1",
    paddingVertical: 3,
  },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8, color: "#5b6b80" },
  sign: { flexDirection: "row", justifyContent: "space-between", marginTop: 30 },
  signBox: {
    width: "42%",
    borderTopWidth: 1,
    borderTopColor: "#8a99ad",
    paddingTop: 4,
    textAlign: "center",
    fontSize: 8,
    color: "#5b6b80",
  },
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    fontSize: 7,
    color: "#7a889a",
    textAlign: "center",
    borderTopWidth: 0.5,
    borderTopColor: "#d8e1ec",
    paddingTop: 5,
  },
  accent: { color: CYAN },
});

type OrderForPdf = {
  code: string;
  status: keyof typeof serviceOrderStatusLabel;
  receivedAt: Date;
  deviceType: keyof typeof deviceTypeLabel;
  brand: string;
  model: string | null;
  serialNumber: string | null;
  accessories: string | null;
  physicalCondition: string | null;
  reportedIssue: string;
  deliveryMode: keyof typeof serviceDeliveryModeLabel;
  estimatedReadyAt: Date | null;
  finalResult: string | null;
  completedAt: Date | null;
  deliveredAt: Date | null;
  warrantyDays: number | null;
  warrantyTerms: string | null;
  closingRecommendations: string | null;
  customerConformity: boolean | null;
  dataBackupAuthorized: boolean;
  accessProvided: boolean;
  customer: {
    fullName: string;
    phone: string;
    email: string | null;
    documentType: string | null;
    documentNumber: string | null;
  };
  service: { name: string } | null;
  technician: { user: { name: string } } | null;
  diagnoses: {
    findings: string;
    technicalDiagnosis: string;
    testsPerformed: string | null;
    recommendations: string | null;
  }[];
  approvals: {
    budgetCents: number;
    description: string;
    decision: keyof typeof approvalDecisionLabel;
    sentAt: Date;
    respondedAt: Date | null;
    evidence: string | null;
  }[];
  repairTasks: { description: string; performedAt: Date }[];
  parts: {
    name: string;
    quantity: number;
    serialNumber: string | null;
    unitPriceCents: number | null;
  }[];
  quality: { passed: boolean; performedAt: Date; items: { label: string; result: string }[] }[];
};

function KV({ label, value, w = "33" }: { label: string; value?: string | null; w?: "33" | "50" }) {
  return (
    <View style={w === "50" ? s.cell2 : s.cell}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || "—"}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.sTitle}>{title}</Text>
      <View style={s.body}>{children}</View>
    </View>
  );
}

function ServiceOrderDoc({
  o,
  logo,
  biz,
}: {
  o: OrderForPdf;
  logo: Buffer;
  biz: BusinessSettings;
}) {
  const diag = o.diagnoses[0];
  const qc = o.quality[0];
  return (
    <Document
      title={`Orden de servicio ${o.code}`}
      author="ELZIIUS"
      subject="Orden de servicio técnico"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          {/* Logotipo oficial sin modificaciones */}
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image no admite alt */}
          <Image src={logo} style={s.logo} />
          <View>
            <Text style={s.hTitle}>ORDEN DE SERVICIO TÉCNICO</Text>
            <Text style={s.hCode}>{o.code}</Text>
            <Text style={s.hMeta}>
              Estado: {serviceOrderStatusLabel[o.status]} · Emitido: {formatDateTime(new Date())}
            </Text>
            {biz.ruc ? (
              <Text style={s.hMeta}>
                {biz.commercialName} · RUC {biz.ruc}
              </Text>
            ) : null}
          </View>
        </View>

        <Section title="CLIENTE">
          <View style={s.row}>
            <KV label="Nombre" value={o.customer.fullName} />
            <KV
              label="Documento"
              value={
                o.customer.documentNumber
                  ? `${o.customer.documentType ?? ""} ${o.customer.documentNumber}`
                  : null
              }
            />
            <KV label="Teléfono" value={o.customer.phone} />
            <KV label="Correo" value={o.customer.email} />
            <KV label="Fecha de ingreso" value={formatDateTime(o.receivedAt)} />
            <KV label="Modalidad de entrega" value={serviceDeliveryModeLabel[o.deliveryMode]} />
          </View>
        </Section>

        <Section title="EQUIPO RECIBIDO">
          <View style={s.row}>
            <KV label="Tipo" value={deviceTypeLabel[o.deviceType]} />
            <KV label="Marca / modelo" value={`${o.brand} ${o.model ?? ""}`} />
            <KV label="N.º de serie" value={o.serialNumber} />
            <KV label="Accesorios" value={o.accessories} w="50" />
            <KV label="Servicio solicitado" value={o.service?.name} w="50" />
            <KV label="Estado físico" value={o.physicalCondition} w="50" />
            <KV label="Problema reportado" value={o.reportedIssue} w="50" />
            <KV
              label="Acceso al sistema"
              value={o.accessProvided ? "Brindado (contraseña no registrada)" : "No brindado"}
              w="50"
            />
            <KV
              label="Respaldo de información"
              value={o.dataBackupAuthorized ? "Autorizado" : "No autorizado"}
              w="50"
            />
          </View>
        </Section>

        {diag && (
          <Section title="DIAGNÓSTICO">
            <View style={s.row}>
              <KV label="Fallas identificadas" value={diag.findings} w="50" />
              <KV label="Pruebas realizadas" value={diag.testsPerformed} w="50" />
              <KV label="Diagnóstico técnico" value={diag.technicalDiagnosis} w="50" />
              <KV label="Recomendaciones" value={diag.recommendations} w="50" />
              <KV label="Técnico responsable" value={o.technician?.user.name} />
            </View>
          </Section>
        )}

        {o.approvals.length > 0 && (
          <Section title="PRESUPUESTO Y AUTORIZACIÓN">
            {o.approvals.map((a, i) => (
              <View key={i} style={s.tr}>
                <Text style={{ width: "18%" }}>{formatPEN(a.budgetCents)}</Text>
                <Text style={{ width: "42%" }}>{a.description}</Text>
                <Text style={{ width: "15%" }}>{approvalDecisionLabel[a.decision]}</Text>
                <Text style={{ width: "25%", fontSize: 7 }}>
                  {a.respondedAt
                    ? formatDateTime(a.respondedAt)
                    : `Enviado ${formatDate(a.sentAt)}`}
                  {a.evidence ? ` · ${a.evidence}` : ""}
                </Text>
              </View>
            ))}
          </Section>
        )}

        {(o.repairTasks.length > 0 || o.parts.length > 0) && (
          <Section title="TRABAJOS REALIZADOS Y REPUESTOS">
            {o.repairTasks.map((t, i) => (
              <Text key={i} style={s.para}>
                • {t.description} ({formatDate(t.performedAt)})
              </Text>
            ))}
            {o.parts.length > 0 && (
              <View style={{ marginTop: 6 }}>
                <View style={s.tr}>
                  <Text style={[s.th, { width: "50%" }]}>Repuesto</Text>
                  <Text style={[s.th, { width: "15%" }]}>Cant.</Text>
                  <Text style={[s.th, { width: "20%" }]}>Serie</Text>
                  <Text style={[s.th, { width: "15%" }]}>P. unit.</Text>
                </View>
                {o.parts.map((p, i) => (
                  <View key={i} style={s.tr}>
                    <Text style={{ width: "50%" }}>{p.name}</Text>
                    <Text style={{ width: "15%" }}>{p.quantity}</Text>
                    <Text style={{ width: "20%" }}>{p.serialNumber ?? "—"}</Text>
                    <Text style={{ width: "15%" }}>{formatPEN(p.unitPriceCents)}</Text>
                  </View>
                ))}
              </View>
            )}
          </Section>
        )}

        {qc && (
          <Section title={`CONTROL DE CALIDAD — ${qc.passed ? "APROBADO" : "CON OBSERVACIONES"}`}>
            <View style={s.row}>
              {qc.items.map((it, i) => (
                <KV
                  key={i}
                  label={it.label}
                  value={it.result === "PASS" ? "OK" : it.result === "FAIL" ? "Falla" : "N/A"}
                />
              ))}
            </View>
          </Section>
        )}

        {(o.finalResult || o.deliveredAt) && (
          <Section title="CIERRE Y ENTREGA">
            <View style={s.row}>
              <KV label="Resultado final" value={o.finalResult} w="50" />
              <KV
                label="Fecha de entrega"
                value={o.deliveredAt ? formatDateTime(o.deliveredAt) : null}
                w="50"
              />
              <KV
                label="Garantía"
                value={o.warrantyDays ? `${o.warrantyDays} días` : null}
                w="50"
              />
              <KV
                label="Conformidad del cliente"
                value={
                  o.customerConformity == null
                    ? null
                    : o.customerConformity
                      ? "Conforme"
                      : "No conforme"
                }
                w="50"
              />
              <KV label="Condiciones de garantía" value={o.warrantyTerms} w="50" />
              <KV label="Recomendaciones" value={o.closingRecommendations} w="50" />
            </View>
          </Section>
        )}

        <Text style={[s.para, { fontSize: 7.5, color: "#5b6b80", marginTop: 4 }]}>
          Consulta el estado de tu equipo en <Text style={s.accent}>/seguimiento</Text> con el
          código {o.code} y el correo o teléfono registrado. ELZIIUS no ejecuta reparaciones sin la
          autorización del cliente. La información del equipo se trata de forma confidencial
          conforme a la Ley N.º 29733.
        </Text>

        <View style={s.sign}>
          <Text style={s.signBox}>Firma ELZIIUS</Text>
          <Text style={s.signBox}>Firma del cliente · {o.customer.fullName}</Text>
        </View>

        <Text
          style={s.footer}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${biz.commercialName}${biz.address ? ` · ${biz.address}` : ""}${biz.phone ? ` · ${biz.phone}` : ""}${biz.email ? ` · ${biz.email}` : ""} — Página ${pageNumber} de ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export async function renderServiceOrderPdf(o: OrderForPdf, biz: BusinessSettings) {
  const logo = await readFile(path.join(process.cwd(), "public/logo/elziius-logo-original.jpg"));
  return renderToBuffer(<ServiceOrderDoc o={o} logo={logo} biz={biz} />);
}
