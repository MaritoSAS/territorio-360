import type { Dimension, Indicator } from "@/lib/types";

export const DIMENSIONS: { id: Dimension; nombre: string }[] = [
  { id: "ambiental", nombre: "Ambiental" },
  { id: "social", nombre: "Social" },
  { id: "economica", nombre: "Económica" },
  { id: "institucional", nombre: "Institucional" },
  { id: "gestion", nombre: "Calidad de gestión" },
];

/**
 * Progreso normalizado hacia la meta (0–1). Solo es calculable si hay línea de base, meta y valor,
 * y la meta difiere de la línea de base. En otro caso devuelve null (dato faltante).
 */
export function progress(ind: Indicator): number | null {
  const { lineaBase: b, meta: m, valorObservado: v } = ind;
  if (b === null || m === null || v === null || m === b) return null;
  const p = (v - b) / (m - b);
  return Math.max(0, Math.min(1, p));
}

export interface IetResult {
  dimension: Dimension;
  nombre: string;
  score: number | null;
  usados: Indicator[];
  faltantes: Indicator[];
}

/**
 * IET 360 — PROTOTIPO EXPERIMENTAL.
 * Supuestos: promedio simple del progreso hacia la meta de los indicadores con datos completos;
 * ponderación igual entre dimensiones (no existe ponderación oficial).
 */
export function computeIet(indicators: Indicator[]) {
  const dims: IetResult[] = DIMENSIONS.map((d) => {
    const ofDim = indicators.filter((i) => i.dimension === d.id);
    const usados = ofDim.filter((i) => progress(i) !== null);
    const faltantes = ofDim.filter((i) => progress(i) === null);
    const score = usados.length ? usados.reduce((a, i) => a + progress(i)!, 0) / usados.length : null;
    return { dimension: d.id, nombre: d.nombre, score, usados, faltantes };
  });
  const conScore = dims.filter((d) => d.score !== null);
  const global = conScore.length ? conScore.reduce((a, d) => a + d.score!, 0) / conScore.length : null;
  return { dims, global, dimensionesSinDatos: dims.filter((d) => d.score === null).map((d) => d.nombre) };
}
