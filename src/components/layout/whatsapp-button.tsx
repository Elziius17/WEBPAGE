"use client";
import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { useBusiness } from "./business-context";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { VariantProps } from "class-variance-authority";

/**
 * Botón de WhatsApp con mensaje contextual. Si el número comercial no está
 * configurado, se muestra deshabilitado con una explicación (no se inventa un número).
 */
export function WhatsAppButton({
  message,
  label = "Escribir por WhatsApp",
  className,
  size = "md",
  variant = "whatsapp",
}: {
  message: string;
  label?: string;
  className?: string;
} & VariantProps<typeof buttonVariants>) {
  const { whatsapp } = useBusiness();
  const href = whatsappLink(message, whatsapp);
  if (!href) {
    return (
      <span
        className={cn(buttonVariants({ variant: "secondary", size }), "cursor-not-allowed opacity-60", className)}
        title="El número de WhatsApp comercial aún no está configurado"
        aria-disabled="true"
      >
        <MessageCircle /> WhatsApp no configurado
      </span>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant, size }), className)}>
      <MessageCircle /> {label}
    </a>
  );
}

export function WhatsAppFloating() {
  const { whatsapp } = useBusiness();
  const href = whatsappLink("Hola, deseo información sobre los servicios de ELZIIUS.", whatsapp);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      className="fixed right-4 bottom-4 z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-[#05301a] shadow-[0_10px_30px_-8px_rgb(37_211_102/0.7)] transition-transform hover:scale-105 sm:right-6 sm:bottom-6"
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
