export const TIME_ZONE = "America/Lima";

const dateFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("es-PE", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: true,
});

export function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return dateFmt.format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return dateTimeFmt.format(new Date(d));
}

/** Inicio del día actual en Lima (UTC-5, sin horario de verano), como Date UTC. */
export function startOfDayLima(now = new Date()): Date {
  const lima = new Date(now.getTime() - 5 * 3600_000);
  return new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), lima.getUTCDate(), 5));
}

/** Inicio del mes actual en Lima, como Date UTC. */
export function startOfMonthLima(now = new Date()): Date {
  const lima = new Date(now.getTime() - 5 * 3600_000);
  return new Date(Date.UTC(lima.getUTCFullYear(), lima.getUTCMonth(), 1, 5));
}

/** Clave "YYYY-MM" del mes en Lima. */
export function monthKeyLima(d: Date): string {
  const lima = new Date(d.getTime() - 5 * 3600_000);
  return `${lima.getUTCFullYear()}-${String(lima.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Convierte "YYYY-MM-DDTHH:mm" (hora de Lima, input datetime-local) a Date UTC. */
export function limaLocalToDate(value: string): Date {
  return new Date(`${value}:00-05:00`);
}

/** Formatea una fecha como valor para <input type="datetime-local"> en hora de Lima. */
export function dateToLimaLocal(d: Date | null | undefined): string {
  if (!d) return "";
  const lima = new Date(d.getTime() - 5 * 3600_000);
  return lima.toISOString().slice(0, 16);
}
