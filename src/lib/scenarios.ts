/**
 * Simulador de escenarios — ESTIMACIONES, no impactos comprobados.
 * Localidades y población departamental son datos oficiales (Georef / Censo 2022 vía IDESA).
 * Costos unitarios y tasas son SUPUESTOS EXPLÍCITOS del equipo, editables en la interfaz.
 */
import localidades from "@/data/open/localidades-salta.json";
import indicadores from "@/data/open/indicadores-departamentales.json";
import type { Dimension } from "@/lib/types";

export type InterventionId = "agua" | "conectividad" | "capacitacion" | "proveedores";

export interface Intervention {
  id: InterventionId;
  nombre: string;
  ods: number[];
  dimensiones: Dimension[];
  indicadores: string[];
  unidad: string;
  costoUnitarioUsd: number;
  /** Cómo se calculan las unidades a partir de las localidades seleccionadas. */
  unidades: (nLocalidades: number, poblacionRef: number, params: ScenarioParams) => number;
  beneficios: string[];
  riesgos: string[];
  faltantes: string[];
}

export interface ScenarioParams {
  tasaParticipacion: number;
  proveedoresPorLocalidad: number;
}

export const DEFAULT_PARAMS: ScenarioParams = { tasaParticipacion: 0.02, proveedoresPorLocalidad: 3 };

export const INTERVENTIONS: Intervention[] = [
  {
    id: "agua",
    nombre: "Infraestructura de agua",
    ods: [6, 3],
    dimensiones: ["ambiental", "social"],
    indicadores: ["IND-AGUA", "IND-AVANCE-OBRA"],
    unidad: "sistemas de agua (1 por localidad)",
    costoUnitarioUsd: 350000,
    unidades: (n) => n,
    beneficios: ["Mayor acceso a agua segura en hogares", "Reducción potencial de enfermedades de origen hídrico", "Base para monitoreo participativo"],
    riesgos: ["Presión sobre fuentes hídricas escasas (R-01)", "Sostenibilidad de operación y mantenimiento"],
    faltantes: ["Línea de base hídrica por localidad", "Hogares por localidad (radios censales 2022 aún no integrados)", "Presupuesto de obra real"],
  },
  {
    id: "conectividad",
    nombre: "Conectividad",
    ods: [9, 4],
    dimensiones: ["institucional", "economica"],
    indicadores: ["IND-CONECTIVIDAD"],
    unidad: "nodos de conectividad (1 por localidad)",
    costoUnitarioUsd: 120000,
    unidades: (n) => n,
    beneficios: ["Acceso a servicios digitales y trámites", "Habilita teleducación y telesalud", "Mejora la carga de datos territoriales"],
    riesgos: ["Costos de operación en altura", "Dependencia de un único proveedor"],
    faltantes: ["Cobertura actual por localidad (ENACOM)", "Demanda estimada de usuarios"],
  },
  {
    id: "capacitacion",
    nombre: "Capacitación laboral",
    ods: [8, 4],
    dimensiones: ["social", "economica"],
    indicadores: ["IND-PROVEEDORES"],
    unidad: "participantes (tasa × población departamental)",
    costoUnitarioUsd: 900,
    unidades: (_n, pob, p) => Math.round(pob * p.tasaParticipacion),
    beneficios: ["Mayor empleabilidad local", "Reducción de expectativas no satisfechas (R-02)"],
    riesgos: ["Capacitación sin demanda laboral efectiva", "Deserción por distancias"],
    faltantes: ["Población económicamente activa por localidad", "Demanda de perfiles del proyecto"],
  },
  {
    id: "proveedores",
    nombre: "Fortalecimiento de proveedores locales",
    ods: [8, 10],
    dimensiones: ["economica", "gestion"],
    indicadores: ["IND-PROVEEDORES", "IND-COMPRAS-LOCALES"],
    unidad: "proveedores acompañados",
    costoUnitarioUsd: 15000,
    unidades: (n, _p, p) => n * p.proveedoresPorLocalidad,
    beneficios: ["Mayor proporción de compras locales", "Retención del ingreso en el territorio"],
    riesgos: ["Concentración de compras fuera del territorio (R-05)", "Capacidad formal limitada de proveedores"],
    faltantes: ["Registro de proveedores por localidad", "Volumen de compras del proyecto"],
  },
];

export const PUNA_DEPTOS = ["Los Andes", "La Poma"];
export const candidateLocalities = localidades.localidades.filter((l) => PUNA_DEPTOS.includes(l.departamento ?? ""));

export interface ScenarioInput {
  nombre: string;
  intervenciones: InterventionId[];
  localidadIds: string[];
  presupuestoUsd: number;
  costos: Record<InterventionId, number>;
  params: ScenarioParams;
}

export function evaluate(s: ScenarioInput) {
  const locs = candidateLocalities.filter((l) => s.localidadIds.includes(l.id));
  const deptos = [...new Set(locs.map((l) => l.departamento!))];
  const poblacionRef = indicadores.filas.filter((f) => deptos.includes(f.departamento)).reduce((a, f) => a + f.poblacion_2022, 0);
  const ints = INTERVENTIONS.filter((i) => s.intervenciones.includes(i.id));
  const lineas = ints.map((i) => {
    const unidades = i.unidades(locs.length, poblacionRef, s.params);
    return { i, unidades, costo: unidades * s.costos[i.id] };
  });
  const costoTotal = lineas.reduce((a, l) => a + l.costo, 0);
  return {
    locs,
    deptos,
    poblacionRef,
    lineas,
    costoTotal,
    cobertura: s.presupuestoUsd > 0 ? costoTotal / s.presupuestoUsd : 0,
    ods: [...new Set(ints.flatMap((i) => i.ods))].sort((a, b) => a - b),
    dimensiones: [...new Set(ints.flatMap((i) => i.dimensiones))],
    indicadores: [...new Set(ints.flatMap((i) => i.indicadores))],
    beneficios: ints.flatMap((i) => i.beneficios),
    riesgos: ints.flatMap((i) => i.riesgos),
    faltantes: [...new Set(ints.flatMap((i) => i.faltantes))],
  };
}

export const defaultCosts = () => Object.fromEntries(INTERVENTIONS.map((i) => [i.id, i.costoUnitarioUsd])) as Record<InterventionId, number>;
