/** Cada cambio de sección vuelve a montar la plantilla y su contenido entra con una animación suave. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
