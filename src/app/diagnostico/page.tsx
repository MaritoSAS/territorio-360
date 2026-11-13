"use client";

import { useMemo, useState } from "react";
import { DemoBadge, Notice, OdsChip, OfficialBadge, PageHeader, StatusPill, ValidationBadge } from "@/components/ui";
import { indicators, ODS_INFO, ODS_PRIORITARIOS, provincia } from "@/data/indicators";
import { territories } from "@/data/demo";
import { answer, commitmentsByTerritory, dataGaps, decisionsAndGrounds, indicatorsWithEvidence, PRESET_QUERIES, projectsWithOverdue, risksByProject, type QueryAnswer } from "@/lib/graph";
import { computeIet, progress } from "@/lib/iet";
import { useStore } from "@/lib/store";
import type { Indicator } from "@/lib/types";

function IndicatorCard({ i }: { i: Indicator }) {
  const [open, setOpen] = useState(false);
  const p = progress(i);
  return (
    <div className="card flex flex-col p-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {i.ods.map((o) => (
          <OdsChip key={o} n={o} />
        ))}
        <span className="ml-auto">{i.demo ? <DemoBadge /> : <OfficialBadge label="Dato oficial · cálculo propio" />}</span>
      </div>
      <h3 className="mt-2 font-semibold text-navy-900">{i.nombre}</h3>
      <div className="mt-2 flex items-end gap-2">
        <p className="text-3xl font-bold text-navy-800">{i.valorObservado ?? "—"}</p>
        <p className="pb-1 text-xs text-slate-500">{i.unidad}</p>
      </div>
      {p !== null ? (
        <div className="mt-2">
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full bg-eco-500" style={{ width: `${p * 100}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Línea de base {i.lineaBase} → meta {i.meta} · progreso {Math.round(p * 100)}%
          </p>
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-slate-500">Sin línea de base o meta: no se calcula progreso.</p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
        <ValidationBadge status={i.validacion} />
        <span>Confianza {i.confianza}</span>
        <span>· {i.fecha}</span>
      </div>
      <p className="mt-2 text-xs text-slate-600">
        <b>Fuente:</b>{" "}
        {i.fuenteUrl ? (
          <a className="text-navy-700 underline" href={i.fuenteUrl} target="_blank" rel="noreferrer">
            {i.fuente}
          </a>
        ) : (
          i.fuente
        )}
      </p>
      <button className="mt-2 self-start text-xs font-semibold text-eco-700" onClick={() => setOpen((o) => !o)}>
        {open ? "Ocultar ficha metodológica" : "Ver ficha metodológica"}
      </button>
      {open && (
        <dl className="mt-2 grid grid-cols-[110px_1fr] gap-x-2 gap-y-1 rounded-lg bg-canvas p-2 text-[11px]">
          <dt className="text-slate-500">Definición</dt>
          <dd>{i.definicion}</dd>
          <dt className="text-slate-500">Dimensión</dt>
          <dd>{i.dimension}</dd>
          <dt className="text-slate-500">Cobertura</dt>
          <dd>{i.cobertura}</dd>
          <dt className="text-slate-500">Metodología</dt>
          <dd>{i.metodologia}</dd>
          {i.limitaciones && (
            <>
              <dt className="text-slate-500">Limitaciones</dt>
              <dd>{i.limitaciones}</dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}

function AnswerView({ a }: { a: QueryAnswer }) {
  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold text-navy-900">{a.pregunta}</p>
        {a.demo && <DemoBadge />}
      </div>
      <p className="mt-1 text-sm text-slate-700">{a.resumen}</p>
      <ul className="mt-3 divide-y divide-slate-100">
        {a.items.map((it, k) => (
          <li key={k} className="py-2 text-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium">{it.titulo}</span>
              {it.tags?.map((t) => (
                <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {t}
                </span>
              ))}
            </div>
            {it.detalle && <p className="text-xs text-slate-500">{it.detalle}</p>}
          </li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2 text-xs md:grid-cols-2">
        <p>
          <b>Fuentes:</b> {a.fuentes.join(" · ")}
        </p>
        <p>
          <b>Limitaciones:</b> {a.limitaciones.join(" ")}
        </p>
      </div>
    </div>
  );
}

export default function Diagnostico() {
  const { role, submissions } = useStore();
  const ctx = useMemo(() => ({ role, extraEvidence: submissions.map((s) => ({ commitmentId: s.commitmentId })) }), [role, submissions]);
  const [filter, setFilter] = useState<number | "all">("all");
  const [territory, setTerritory] = useState("LOC-OLACAPATO");
  const [q, setQ] = useState("");
  const [result, setResult] = useState<QueryAnswer | null>(null);
  const [noAnswer, setNoAnswer] = useState(false);
  const iet = computeIet(indicators);

  const shown = indicators.filter((i) => (filter === "all" ? i.ods.some((o) => ODS_PRIORITARIOS.includes(o)) : i.ods.includes(filter)));

  const runPreset = (id: string) => {
    setNoAnswer(false);
    const r =
      id === "territorio"
        ? commitmentsByTerritory(territory)
        : id === "evidencia"
          ? indicatorsWithEvidence(ctx)
          : id === "vencidos"
            ? projectsWithOverdue()
            : id === "riesgos"
              ? risksByProject("PDP-01", ctx)
              : id === "decisiones"
                ? decisionsAndGrounds()
                : dataGaps();
    setResult(r);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        modulo="Módulos 02 y 03 · Pantalla 2"
        title="Diagnóstico Inteligente"
        subtitle="Indicadores ODS con fuente, metodología, fecha y estado de validación. Se distinguen los datos oficiales de las cifras simuladas del caso."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={`btn ${filter === "all" ? "btn-primary" : "btn-ghost"}`}>
          ODS prioritarios
        </button>
        {ODS_PRIORITARIOS.map((o) => (
          <button key={o} onClick={() => setFilter(o)} className={`btn ${filter === o ? "btn-primary" : "btn-ghost"}`} title={ODS_INFO[o].nombre}>
            ODS {o}
          </button>
        ))}
      </div>
      {filter !== "all" && <p className="mb-3 text-sm text-slate-600">ODS {filter}: {ODS_INFO[filter].nombre}</p>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((i) => (
          <IndicatorCard key={i.id} i={i} />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Referencia provincial (cálculo propio, IDESA): {provincia.saludCada10k} establecimientos de salud y {provincia.eduCada10k} educativos cada 10.000
        hab. sobre {provincia.poblacion.toLocaleString("es-AR")} habitantes (Censo 2022).
      </p>

      <section id="iet" className="mt-12 scroll-mt-28">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold text-navy-900">Índice de Equilibrio Territorial — IET 360</h2>
          <StatusPill tone="warn">Prototipo experimental</StatusPill>
        </div>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Complementa —no sustituye— los indicadores oficiales de ODS. Supuestos: progreso normalizado hacia la meta (0–100) por indicador,
          promedio simple por dimensión y <b>ponderación igual entre dimensiones</b> (no existe una ponderación oficial). Se excluyen indicadores sin
          línea de base o meta.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <div className="card flex flex-col justify-center p-4 text-center md:col-span-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">IET global</p>
            <p className="text-4xl font-extrabold text-navy-900">{iet.global !== null ? Math.round(iet.global * 100) : "—"}</p>
            <p className="text-[11px] text-slate-500">/ 100 · área PDP-01</p>
            <DemoBadge className="mt-2 self-center" />
          </div>
          {iet.dims.map((d) => (
            <div key={d.dimension} className="card p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase">{d.nombre}</p>
              <p className="text-2xl font-bold text-navy-800">{d.score !== null ? Math.round(d.score * 100) : "s/d"}</p>
              <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                <div className="h-1.5 rounded-full bg-eco-500" style={{ width: `${(d.score ?? 0) * 100}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                {d.usados.length} indicador(es) usados{d.faltantes.length ? ` · ${d.faltantes.length} excluido(s) por datos faltantes` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="consultas" className="mt-12 scroll-mt-28">
        <h2 className="text-xl font-bold text-navy-900">Consultas sobre el grafo territorial</h2>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">
          Motor de consultas determinístico sobre el grafo Proyectos → Territorios → Actores → Compromisos → Indicadores → Mediciones → Evidencias →
          Riesgos → Decisiones. Responde solo con registros existentes, cita fuentes y respeta los permisos del rol activo.
        </p>
        <Notice tone="warn" title="IA generativa: pendiente">
          La integración con OCI Generative AI no está conectada en este MVP (no hay credenciales). Este módulo no usa un modelo de lenguaje: no
          redacta ni infiere más allá de los datos.
        </Notice>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="card space-y-2 p-4">
            {PRESET_QUERIES.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <button onClick={() => runPreset(p.id)} className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-eco-500 hover:bg-eco-100/30">
                  {p.label}
                </button>
                {p.id === "territorio" && (
                  <select value={territory} onChange={(e) => setTerritory(e.target.value)} className="rounded-md border border-slate-300 px-2 py-2 text-xs">
                    {territories
                      .filter((t) => t.tipo !== "provincia")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            ))}
            <form
              className="flex gap-2 pt-2"
              onSubmit={(e) => {
                e.preventDefault();
                const r = answer(q, ctx);
                setResult(r);
                setNoAnswer(!r);
              }}
            >
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ej.: ¿qué compromisos hay en Tolar Grande?"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <button className="btn btn-primary" disabled={!q.trim()}>
                Consultar
              </button>
            </form>
          </div>
          <div>
            {noAnswer && (
              <Notice tone="warn" title="Sin respuesta fundamentada">
                No hay datos en el grafo para responder esa pregunta. Probá con compromisos, evidencias, vencimientos, riesgos, decisiones o datos
                faltantes.
              </Notice>
            )}
            {result && <AnswerView a={result} />}
            {!result && !noAnswer && <p className="text-sm text-slate-500">Elegí una consulta para ver la respuesta con sus fuentes.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
