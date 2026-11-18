import data from "@/data/market-suggestions.json";

export type MarketSuggestion = {
  id: string;
  category: string;
  brand: string;
  model: string;
  name: string;
  shortDescription: string;
  description: string;
  specs: { label: string; value: string }[];
  priceRangePEN: { min: number; max: number } | null;
  officialUrl: string | null;
  searchTerms: string[];
};

/** Fecha de la investigación de mercado (docs/INVESTIGACION_MERCADO.md). */
export const marketResearchDate = data.researchedAt;
export const marketSuggestions = data.products as MarketSuggestion[];

export function findSuggestion(id: string | undefined) {
  return id ? marketSuggestions.find((s) => s.id === id) : undefined;
}

/** Normaliza marca + modelo para detectar si la sugerencia ya se registró. */
export const productKey = (brand: string, model?: string | null) =>
  `${brand} ${model ?? ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
