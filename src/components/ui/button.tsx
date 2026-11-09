import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-brand-blue to-brand-cyan text-ink-950 shadow-[0_8px_30px_-12px_rgb(0_153_255/0.8)] hover:brightness-110 hover:shadow-[0_10px_36px_-10px_rgb(0_210_255/0.85)] active:scale-[0.98]",
        secondary:
          "border border-white/12 bg-white/5 text-fg hover:border-brand-cyan/40 hover:bg-white/8 active:scale-[0.98]",
        ghost: "text-fg-muted hover:bg-white/6 hover:text-fg",
        danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
        whatsapp: "bg-[#25D366] text-[#05301a] hover:brightness-105 active:scale-[0.98]",
        link: "text-brand-cyan underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & VariantProps<typeof buttonVariants>;

export function ButtonLink({ className, variant, size, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
