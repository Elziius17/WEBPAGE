"use client";
import { createContext, use, type ReactNode } from "react";
import type { PublicBusinessInfo } from "@/services/settings";

const BusinessContext = createContext<PublicBusinessInfo | null>(null);

export function BusinessProvider({
  value,
  children,
}: {
  value: PublicBusinessInfo;
  children: ReactNode;
}) {
  return <BusinessContext value={value}>{children}</BusinessContext>;
}

export function useBusiness(): PublicBusinessInfo {
  const v = use(BusinessContext);
  if (!v) throw new Error("useBusiness debe usarse dentro de BusinessProvider");
  return v;
}
