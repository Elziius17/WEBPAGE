"use client";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

/**
 * Paleta de gráficos validada (modo oscuro, superficie #0f2b4d) con el validador
 * de dataviz: lightness band, chroma, CVD ΔE > 20, contraste ≥ 3:1.
 */
export const CHART = { products: "#0098C4", services: "#C27A12", grid: "rgba(255,255,255,0.06)", axis: "#6f88a6", surface: "#0f2b4d" };

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const monthLabel = (m: string) => {
  const [y, mm] = m.split("-");
  return `${MONTHS[Number(mm) - 1]} ${y?.slice(2)}`;
};
const soles = (v: number) => `S/ ${v.toLocaleString("es-PE", { maximumFractionDigits: 0 })}`;

const tooltipStyle = {
  contentStyle: { background: "#071629", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#eaf2fb" },
  labelStyle: { color: "#a3b6cd", marginBottom: 4 },
  itemStyle: { color: "#eaf2fb" },
  cursor: { fill: "rgba(255,255,255,0.04)" },
};
const axisProps = { stroke: CHART.axis, fontSize: 11, tickLine: false, axisLine: false } as const;

function DataTableFallback({ caption, head, rows }: { caption: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <details className="mt-2 text-xs">
      <summary className="cursor-pointer text-fg-subtle hover:text-fg">Ver datos en tabla</summary>
      <table className="mt-2 w-full">
        <caption className="sr-only">{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} className="py-1 text-left font-medium text-fg-subtle">{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} className="border-t border-white/5">{r.map((c, j) => <td key={j} className="py-1 text-fg-muted">{c}</td>)}</tr>)}</tbody>
      </table>
    </details>
  );
}

export function MonthlySalesChart({ data }: { data: { month: string; products: number; services: number }[] }) {
  const d = data.map((r) => ({ ...r, label: monthLabel(r.month) }));
  return (
    <div>
      <div className="h-64" role="img" aria-label="Ventas mensuales de productos y servicios">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={d} barGap={2} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={soles} width={72} />
            <Tooltip {...tooltipStyle} formatter={(v) => soles(Number(v))} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#a3b6cd" }} />
            <Bar dataKey="products" name="Productos" fill={CHART.products} radius={[4, 4, 0, 0]} maxBarSize={22} />
            <Bar dataKey="services" name="Servicios" fill={CHART.services} radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTableFallback caption="Ventas mensuales" head={["Mes", "Productos", "Servicios"]} rows={d.map((r) => [r.label, soles(r.products), soles(r.services)])} />
    </div>
  );
}

export function HorizontalBars({ data, label, unit = "" }: { data: { name: string; value: number }[]; label: string; unit?: string }) {
  if (!data.length) return <p className="py-10 text-center text-sm text-fg-subtle">Aún no hay datos.</p>;
  return (
    <div>
      <div style={{ height: Math.max(140, data.length * 34 + 20) }} role="img" aria-label={label}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }} barCategoryGap={8}>
            <CartesianGrid horizontal={false} stroke={CHART.grid} />
            <XAxis type="number" {...axisProps} allowDecimals={false} />
            <YAxis type="category" dataKey="name" {...axisProps} width={150} tick={{ fill: "#a3b6cd", fontSize: 11 }} tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)} />
            <Tooltip {...tooltipStyle} formatter={(v) => [`${v}${unit}`, label]} />
            <Bar dataKey="value" fill={CHART.products} radius={[0, 4, 4, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTableFallback caption={label} head={["Elemento", "Valor"]} rows={data.map((r) => [r.name, `${r.value}${unit}`])} />
    </div>
  );
}

export function InventoryLine({ data }: { data: { month: string; units: number }[] }) {
  const d = data.map((r) => ({ ...r, label: monthLabel(r.month) }));
  return (
    <div>
      <div className="h-52" role="img" aria-label="Evolución del inventario en unidades">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={d} margin={{ right: 12 }}>
            <CartesianGrid vertical={false} stroke={CHART.grid} />
            <XAxis dataKey="label" {...axisProps} />
            <YAxis {...axisProps} allowDecimals={false} width={44} />
            <Tooltip {...tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.2)" }} formatter={(v) => [`${v} unid.`, "Inventario"]} />
            <Line type="linear" dataKey="units" stroke={CHART.products} strokeWidth={2} dot={{ r: 4, fill: CHART.products, stroke: CHART.surface, strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <DataTableFallback caption="Inventario por mes" head={["Mes", "Unidades"]} rows={d.map((r) => [r.label, r.units])} />
    </div>
  );
}
