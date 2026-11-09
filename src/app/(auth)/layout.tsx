import Link from "next/link";
import { LogoFull } from "@/components/brand/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-12">
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" aria-hidden />
      <div className="absolute top-1/4 left-1/2 h-96 w-[600px] -translate-x-1/2 rounded-full bg-brand-blue/15 blur-[100px]" aria-hidden />
      <div className="relative w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center" aria-label="Ir al inicio">
          <LogoFull className="h-28 w-auto" withTagline={false} />
        </Link>
        <div className="surface p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
