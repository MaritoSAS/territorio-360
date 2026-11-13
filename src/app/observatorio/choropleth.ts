import indicadores from "@/data/open/indicadores-departamentales.json";

export type ChoroplethKey = "densidad_hab_km2" | "poblacion_2022" | "salud_cada_10k_hab" | "educativos_cada_10k_hab" | "none";

export const CHOROPLETH: Record<Exclude<ChoroplethKey, "none">, { nombre: string; unidad: string }> = {
  densidad_hab_km2: { nombre: "Densidad de población", unidad: "hab/km²" },
  poblacion_2022: { nombre: "Población (Censo 2022)", unidad: "hab." },
  salud_cada_10k_hab: { nombre: "Establecimientos de salud", unidad: "c/10.000 hab." },
  educativos_cada_10k_hab: { nombre: "Establecimientos educativos", unidad: "c/10.000 hab." },
};

export const PALETTE = ["#e8f1fb", "#c0d6ef", "#8fb5df", "#5b8fca", "#2f68ae", "#13315c"];

export function quantileBreaks(key: Exclude<ChoroplethKey, "none">) {
  const vals = indicadores.filas.map((f) => f[key] as number).sort((a, b) => a - b);
  return [1, 2, 3, 4, 5].map((i) => vals[Math.floor((i * vals.length) / 6)]);
}
export const colorFor = (v: number, breaks: number[]) => PALETTE[breaks.filter((b) => v >= b).length];

