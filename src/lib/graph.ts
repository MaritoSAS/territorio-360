/**
 * Grafo Territorial de Evidencias y Decisiones:
 * PROYECTOS → TERRITORIOS → ACTORES → COMPROMISOS → INDICADORES → MEDICIONES → EVIDENCIAS → RIESGOS → DECISIONES.
 * Motor de consultas determinístico (sin LLM): cada respuesta se arma solo con registros existentes,
 * cita sus fuentes y declara limitaciones. Respeta permisos por rol.
 */
import { actorName, commitments, decisions, evidences, measurements, projects, risks, territories, territoryName } from "@/data/demo";
import { indicatorById, indicators } from "@/data/indicators";
import { can } from "@/lib/roles";
import { effectiveStatus, STATUS_LABEL, VALIDATION_LABEL } from "@/lib/status";
import type { Role, ValidationStatus } from "@/lib/types";

export interface QueryAnswer {
  pregunta: string;
  resumen: string;
  items: { titulo: string; detalle?: string; tags?: string[] }[];
  fuentes: string[];
  limitaciones: string[];
  demo: boolean;
}

const RANK: Record<ValidationStatus, number> = { declarado: 0, documentado: 1, contrastado: 2, verificado: 3 };
const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export interface GraphContext {
  role: Role;
  /** Huellas presentadas en esta sesión (Pasaporte), por compromiso. */
  extraEvidence?: { commitmentId: string }[];
}

export function commitmentsByTerritory(territoryId: string): QueryAnswer {
  const t = territories.find((x) => x.id === territoryId);
  const scope = t?.tipo === "departamento" ? territories.filter((x) => x.departamento === t.nombre).map((x) => x.id).concat(territoryId) : [territoryId];
  const list = commitments.filter((c) => c.territorioIds.some((id) => scope.includes(id)));
  return {
    pregunta: `¿Qué compromisos están relacionados con ${territoryName(territoryId)}?`,
    resumen: list.length
      ? `${list.length} compromiso(s) vinculados a ${territoryName(territoryId)}${t?.tipo === "departamento" ? " (incluye sus localidades)" : ""}.`
      : `No hay compromisos registrados para ${territoryName(territoryId)}.`,
    items: list.map((c) => ({
      titulo: `${c.id} · ${c.titulo}`,
      detalle: `Responsable: ${actorName(c.responsableActorId)} · Límite ${c.fechaLimite} · Avance ${c.avance}%`,
      tags: [STATUS_LABEL[effectiveStatus(c)], ...c.ods.map((o) => `ODS ${o}`)],
    })),
    fuentes: ["Registro de compromisos del SGI (caso demostrativo)", "Localidades: Georef API"],
    limitaciones: ["Vinculación territorio–compromiso declarada por el responsable."],
    demo: true,
  };
}

function evidenceLevel(commitmentIds: string[], ctx: GraphContext): ValidationStatus | null {
  let best: number = -1;
  for (const e of evidences.filter((e) => commitmentIds.includes(e.commitmentId))) best = Math.max(best, RANK[e.validacion]);
  // Una huella presentada en el Pasaporte (anclada o no) acredita nivel «Documentado».
  for (const e of ctx.extraEvidence ?? []) if (commitmentIds.includes(e.commitmentId)) best = Math.max(best, RANK.documentado);
  return best < 0 ? null : (Object.keys(RANK) as ValidationStatus[])[best];
}

export function indicatorsWithEvidence(ctx: GraphContext): QueryAnswer {
  const rows = indicators.map((i) => {
    const cmp = commitments.filter((c) => c.indicatorIds.includes(i.id)).map((c) => c.id);
    const meds = measurements.filter((m) => m.indicatorId === i.id);
    const evLevel = evidenceLevel(cmp, ctx);
    const medLevel = meds.reduce((a, m) => Math.max(a, RANK[m.validacion]), -1);
    const level = Math.max(RANK[i.validacion], medLevel, evLevel ? RANK[evLevel] : -1);
    return { i, level, cmp, meds };
  });
  const suficientes = rows.filter((r) => r.level >= RANK.documentado);
  return {
    pregunta: "¿Qué indicadores tienen evidencias suficientes?",
    resumen: `${suficientes.length} de ${rows.length} indicadores alcanzan al menos el nivel «Documentado». Criterio: existe fuente oficial contrastada o una medición/evidencia con huella documental.`,
    items: rows
      .sort((a, b) => b.level - a.level)
      .map((r) => ({
        titulo: r.i.nombre,
        detalle: `Nivel: ${r.level >= 0 ? VALIDATION_LABEL[(Object.keys(RANK) as ValidationStatus[])[r.level]] : "Sin datos"} · Mediciones: ${r.meds.length} · Fuente: ${r.i.fuente}`,
        tags: [r.level >= RANK.documentado ? "Suficiente" : "Insuficiente", r.i.demo ? "DEMO" : "OFICIAL"],
      })),
    fuentes: ["Catálogo de indicadores", "Mediciones y evidencias del Pasaporte de Impacto"],
    limitaciones: ["«Documentado» acredita existencia e integridad del documento, no la veracidad de su contenido: requiere verificación de terceros."],
    demo: true,
  };
}

export function projectsWithOverdue(): QueryAnswer {
  const items = projects.flatMap((p) => {
    const v = commitments.filter((c) => c.projectId === p.id && effectiveStatus(c) === "vencido");
    return v.map((c) => ({
      titulo: `${p.id} · ${c.id} ${c.titulo}`,
      detalle: `Venció el ${c.fechaLimite} con ${c.avance}% de avance. Responsable: ${actorName(c.responsableActorId)}.`,
      tags: ["Vencido"],
    }));
  });
  return {
    pregunta: "¿Qué proyectos presentan compromisos vencidos?",
    resumen: items.length ? `${new Set(items.map((i) => i.titulo.split(" · ")[0])).size} proyecto(s) con ${items.length} compromiso(s) vencido(s) a la fecha.` : "No hay compromisos vencidos.",
    items,
    fuentes: ["Registro de compromisos del SGI (caso demostrativo)"],
    limitaciones: ["Vencido = fecha límite anterior a hoy y avance < 100 %. El avance es declarado salvo que tenga evidencia asociada."],
    demo: true,
  };
}

export function risksByProject(projectId: string, ctx: GraphContext): QueryAnswer {
  const detail = can(ctx.role, "risk:view_detail");
  const list = risks.filter((r) => r.projectIds.includes(projectId)).sort((a, b) => b.probabilidad * b.impacto - a.probabilidad * a.impacto);
  return {
    pregunta: `¿Qué riesgos territoriales están vinculados con ${projectId}?`,
    resumen: `${list.length} riesgo(s) vinculados, ordenados por nivel (probabilidad × impacto, escala 1–25).`,
    items: list.map((r) => ({
      titulo: `${r.id} · ${r.titulo}`,
      detalle: detail
        ? `Nivel ${r.probabilidad * r.impacto} · Tratamiento: ${r.tratamiento} · Responsable: ${actorName(r.responsableActorId)}`
        : `Nivel ${r.probabilidad * r.impacto} · Detalle de tratamiento visible para gobierno y empresa.`,
      tags: [r.categoria, ...r.territorioIds.map(territoryName)],
    })),
    fuentes: ["Matriz de riesgos (ISO 31000 como referencia metodológica)"],
    limitaciones: ["Valoración cualitativa del equipo; no es un estudio de impacto ambiental.", ...(detail ? [] : ["Rol Comunidad: se ocultan responsables y planes de tratamiento."])],
    demo: true,
  };
}

const fundamentoLabel = (f: { tipo: string; id: string }) => {
  if (f.tipo === "indicador") return `Indicador: ${indicatorById(f.id)?.nombre ?? f.id}`;
  if (f.tipo === "riesgo") return `Riesgo: ${risks.find((r) => r.id === f.id)?.titulo ?? f.id}`;
  if (f.tipo === "evidencia") return `Evidencia: ${evidences.find((e) => e.id === f.id)?.titulo ?? f.id}`;
  if (f.tipo === "compromiso") return `Compromiso: ${commitments.find((c) => c.id === f.id)?.titulo ?? f.id}`;
  return `Escenario: ${f.id}`;
};

export function decisionsAndGrounds(): QueryAnswer {
  return {
    pregunta: "¿Qué decisiones se tomaron y sobre qué información se fundamentaron?",
    resumen: `${decisions.length} decisiones registradas, cada una con sus fundamentos trazables.`,
    items: decisions.map((d) => ({
      titulo: `${d.id} · ${d.titulo}`,
      detalle: `${d.fecha} · ${actorName(d.actorId)} · Fundamentos: ${d.fundamentos.map(fundamentoLabel).join("; ")}`,
      tags: [d.estado],
    })),
    fuentes: ["Registro de decisiones (caso demostrativo)"],
    limitaciones: ["Que una decisión cite un dato no implica que ese dato sea causa suficiente del resultado."],
    demo: true,
  };
}

export function dataGaps(): QueryAnswer {
  const items: QueryAnswer["items"] = [];
  for (const i of indicators) {
    const miss = [i.lineaBase === null && "línea de base", i.meta === null && "meta", i.valorObservado === null && "valor observado"].filter(Boolean);
    if (miss.length) items.push({ titulo: i.nombre, detalle: `Falta: ${miss.join(", ")}.`, tags: ["Dato faltante"] });
    if (i.demo && i.validacion === "declarado") items.push({ titulo: i.nombre, detalle: "Solo dato declarado: requiere fuente oficial o evidencia.", tags: ["Validación pendiente"] });
  }
  for (const c of commitments) {
    const st = effectiveStatus(c);
    if (c.avance >= 100 && !evidences.some((e) => e.commitmentId === c.id && RANK[e.validacion] >= RANK.documentado))
      items.push({ titulo: `${c.id} ${c.titulo}`, detalle: "Declarado como cumplido sin evidencia documentada.", tags: ["Inconsistencia"] });
    if (st === "vencido") items.push({ titulo: `${c.id} ${c.titulo}`, detalle: `Vencido el ${c.fechaLimite}.`, tags: ["Alerta"] });
  }
  return {
    pregunta: "¿Qué datos faltan o son inconsistentes?",
    resumen: `${items.length} hallazgos de calidad de datos.`,
    items,
    fuentes: ["Catálogo de indicadores", "Registro de compromisos y evidencias"],
    limitaciones: ["Reglas de calidad básicas (completitud y coherencia); no detectan errores de medición."],
    demo: true,
  };
}

export const PRESET_QUERIES = [
  { id: "territorio", label: "¿Qué compromisos están relacionados con una localidad?" },
  { id: "evidencia", label: "¿Qué indicadores tienen evidencias suficientes?" },
  { id: "vencidos", label: "¿Qué proyectos presentan compromisos vencidos?" },
  { id: "riesgos", label: "¿Qué riesgos territoriales están vinculados con el proyecto?" },
  { id: "decisiones", label: "¿Qué decisiones se tomaron y con qué fundamentos?" },
  { id: "faltantes", label: "¿Qué datos faltan o son inconsistentes?" },
] as const;

/** Interpreta una pregunta libre por palabras clave. Devuelve null si no puede responder con el grafo. */
export function answer(question: string, ctx: GraphContext, territoryId = "LOC-OLACAPATO"): QueryAnswer | null {
  const q = norm(question);
  const terr = territories.find((t) => q.includes(norm(t.nombre)));
  if (/vencid|atrasad|incumpl/.test(q)) return projectsWithOverdue();
  if (/riesgo/.test(q)) return risksByProject("PDP-01", ctx);
  if (/decisi|fundament/.test(q)) return decisionsAndGrounds();
  if (/falt|inconsist|calidad de (los )?datos|vac[ií]/.test(q)) return dataGaps();
  if (/evidenc|suficien|respald/.test(q)) return indicatorsWithEvidence(ctx);
  if (/compromis|localidad|territorio/.test(q) || terr) return commitmentsByTerritory(terr?.id ?? territoryId);
  return null;
}
