import { useId } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Logotipo oficial ELZIIUS renderizado en línea (SVG).
 * Geometría, proporciones y colores idénticos al archivo original
 * (public/logo/elziius-logo-original.svg); solo se omite el fondo para
 * usarlo sobre las superficies del sitio. El texto usa Montserrat 900,
 * cargada con next/font, igual que en el archivo original.
 */

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-bolt`} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0099FF" />
        <stop offset="50%" stopColor="#00D2FF" />
        <stop offset="100%" stopColor="#66F0FF" />
      </linearGradient>
      <linearGradient id={`${id}-slash`} x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#0088EE" />
        <stop offset="100%" stopColor="#00E5FF" />
      </linearGradient>
    </defs>
  );
}

function IsoGroup({ id }: { id: string }) {
  return (
    <g transform="translate(500, 260)">
      <polygon
        points="0,-165 -142,-82 -142,82 -76,121 -66,105 -123,71 -123,-71 0,-142 54,-111 64,-127"
        fill="#FFFFFF"
      />
      <polygon
        points="88,-113 142,-82 142,82 0,165 -48,137 -38,121 0,142 123,71 123,-71 78,-97"
        fill="#FFFFFF"
      />
      <polygon
        points="-102,-65 -15,-65 -33,-38 -75,-38 -75,-13 -45,-13 -61,12 -75,12 -75,38 -52,38 -69,65 -102,65"
        fill="#FFFFFF"
      />
      <polygon
        points="48,-65 102,-65 102,-38 35,38 102,38 102,65 -18,65 -2,38 64,-38 31,-38"
        fill="#FFFFFF"
      />
      <polygon points="95,-175 -18,-10 12,-10 -95,175 22,5 -10,5" fill={`url(#${id}-bolt)`} />
    </g>
  );
}

const textFont =
  "var(--font-montserrat), 'Montserrat', 'Arial Black', 'Segoe UI', Roboto, Helvetica, sans-serif";

function Wordmark({ id }: { id: string }) {
  return (
    <g transform="translate(500, 515)">
      <text
        x="-38"
        y="0"
        fontFamily={textFont}
        fontWeight="900"
        fontSize="88"
        fill="#FFFFFF"
        textAnchor="end"
        letterSpacing="4"
      >
        ELZ
      </text>
      <polygon points="-24,6 -2,-66 10,-66 -12,6" fill={`url(#${id}-slash)`} />
      <polygon points="2,6 24,-66 36,-66 14,6" fill={`url(#${id}-slash)`} />
      <text
        x="46"
        y="0"
        fontFamily={textFont}
        fontWeight="900"
        fontSize="88"
        fill="#FFFFFF"
        textAnchor="start"
        letterSpacing="4"
      >
        US
      </text>
    </g>
  );
}

/** Isotipo (hexágono EZ + rayo). */
export function LogoMark({ className, title = "ELZIIUS" }: { className?: string; title?: string }) {
  const id = `lm${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox="325 85 350 350"
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <Defs id={id} />
      <IsoGroup id={id} />
    </svg>
  );
}

/** Logotipo completo vertical (isotipo + ELZ//US + descriptor). */
export function LogoFull({
  className,
  withTagline = true,
}: {
  className?: string;
  withTagline?: boolean;
}) {
  const id = `lf${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      viewBox={withTagline ? "260 80 480 500" : "260 80 480 460"}
      className={className}
      role="img"
      aria-label="ELZIIUS — Soporte, Hardware, Web"
    >
      <Defs id={id} />
      <IsoGroup id={id} />
      <Wordmark id={id} />
      {withTagline && (
        <text
          x="500"
          y="562"
          fontFamily={textFont}
          fontWeight="600"
          fontSize="21"
          fill="#FFFFFF"
          textAnchor="middle"
          letterSpacing="5"
        >
          SOPORTE • HARDWARE • WEB
        </text>
      )}
    </svg>
  );
}

/** Versión horizontal para cabecera: isotipo + palabra ELZ//US del logotipo (mismas formas). */
export function LogoHorizontal({ className }: { className?: string }) {
  const id = `lh${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-9 w-9" title="" />
      <svg viewBox="270 440 460 90" className="h-[22px] w-auto" role="img" aria-label="ELZIIUS">
        <Defs id={id} />
        <Wordmark id={id} />
      </svg>
    </span>
  );
}
