"use client";

import { useState } from "react";
import { DemoBadge, Notice, OdsChip, PageHeader } from "@/components/ui";
import { indicatorById } from "@/data/indicators";
import { candidateLocalities, DEFAULT_PARAMS, defaultCosts, evaluate, INTERVENTIONS, type InterventionId, type ScenarioInput, type ScenarioParams } from "@/lib/scenarios";
import { DIMENSIONS } from "@/lib/iet";

const usd = (n: number) => n.toLocaleString("es-AR", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const INITIAL: Omit<ScenarioInput, "costos" | "params">[] = [
  { nombre: "Escenario A — Agua primero", intervenciones: ["agua"], localidadIds: ["66105020", "66105010"], presupuestoUsd: 1_000_000 },
  { nombre: "Escenario B — Economía local", intervenciones: ["proveedores", "capacitacion"], localidadIds: ["66105020", "66105010", "66105030", "66105040"], presupuestoUsd: 1_000_000 },
];

function ScenarioEditor({ s, onChange }: { s: Omit<ScenarioInput, "costos" | "params">; onChange: (s: Omit<ScenarioInput, "costos" | "params">) => void }) {
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  return (
    <div className="space-y-3 text-sm">
      <input value={s.nombre} onChange={(e) => onChange({ ...s, nombre: e.target.value })} className="w-full rounded-md border border-slate-300 px-2 py-1.5 font-semibold" />
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500 uppercase">Intervenciones</p>
        <div className="grid grid-cols-2 gap-1">
          {INTERVENTIONS.map((i) => (
            <label key={i.id} className="flex items-center gap-1.5">
              <input type="checkbox" checked={s.intervenciones.includes(i.id)} onChange={() => onChange({ ...s, intervenciones: toggle(s.intervenciones, i.id) })} />
              {i.nombre}
            </label>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500 uppercase">Localidades (Georef, Puna)</p>
        <div className="grid grid-cols-2 gap-1">
          {candidateLocalities.map((l) => (
            <label key={l.id} className="flex items-center gap-1.5">
              <input type="checkbox" checked={s.localidadIds.includes(l.id)} onChange={() => onChange({ ...s, localidadIds: toggle(s.localidadIds, l.id) })} />
              {l.nombre} <span className="text-[10px] text-slate-400">{l.departamento}</span>
            </label>
          ))}
        </div>
      </div>
      <label className="block">
        <span className="text-xs font-bold text-slate-500 uppercase">Presupuesto disponible (USD, supuesto)</span>
        <input
          type="number"
          min={0}
          step={50000}
          value={s.presupuestoUsd}
          onChange={(e) => onChange({ ...s, presupuestoUsd: Math.max(0, Number(e.target.value)) })}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
        />
      </label>
    </div>
  );
}

function Result({ r, presupuesto }: { r: ReturnType<typeof evaluate>; presupuesto: number }) {
  const over = r.costoTotal > presupuesto;
  return (
    <div className="space-y-4 text-sm">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-canvas p-2">
          <p className="text-2xl font-bold text-navy-900">{r.locs.length}</p>
          <p className="text-[11px] text-slate-500">localidades alcanzadas</p>
        </div>
        <div className="rounded-lg bg-canvas p-2">
          <p className="text-2xl font-bold text-navy-900">{r.poblacionRef.toLocaleString("es-AR")}</p>
          <p className="text-[11px] text-slate-500">hab. en deptos. de referencia (Censo 2022)</p>
        </div>
        <div className={`rounded-lg p-2 ${over ? "bg-rose-50" : "bg-eco-100/50"}`}>
          <p className={`text-2xl font-bold ${over ? "text-rose-700" : "text-eco-700"}`}>{Math.round(r.cobertura * 100)}%</p>
          <p className="text-[11px] text-slate-500">del presupuesto disponible</p>
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500 uppercase">Costo estimado</p>
        <table className="w-full text-xs">
          <tbody>
            {r.lineas.map((l) => (
              <tr key={l.i.id} className="border-b border-slate-100">
                <td className="py-1">{l.i.nombre}</td>
                <td className="py-1 text-slate-500">
                  {l.unidades.toLocaleString("es-AR")} {l.i.unidad}
                </td>
                <td className="py-1 text-right font-semibold">{usd(l.costo)}</td>
              </tr>
            ))}
            <tr>
              <td className="pt-1 font-bold" colSpan={2}>
                Total estimado
              </td>
              <td className={`pt-1 text-right font-bold ${over ? "text-rose-700" : ""}`}>{usd(r.costoTotal)}</td>
            </tr>
          </tbody>
        </table>
        {over && <p className="mt-1 text-xs text-rose-700">Supera el presupuesto en {usd(r.costoTotal - presupuesto)}.</p>}
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500 uppercase">ODS y dimensiones</p>
        <div className="flex flex-wrap gap-1">
          {r.ods.map((o) => (
            <OdsChip key={o} n={o} />
          ))}
          {r.dimensiones.map((d) => (
            <span key={d} className="rounded bg-navy-100 px-1.5 py-0.5 text-[11px] font-semibold text-navy-800">
              {DIMENSIONS.find((x) => x.id === d)?.nombre}
            </span>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-slate-500 uppercase">Indicadores relacionados</p>
        <ul className="list-disc pl-4 text-xs">{r.indicadores.map((i) => <li key={i}>{indicatorById(i)?.nombre ?? i}</li>)}</ul>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-eco-700 uppercase">Beneficios potenciales</p>
        <ul className="list-disc pl-4 text-xs">{r.beneficios.map((b) => <li key={b}>{b}</li>)}</ul>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-rose-700 uppercase">Riesgos</p>
        <ul className="list-disc pl-4 text-xs">{r.riesgos.map((b) => <li key={b}>{b}</li>)}</ul>
      </div>
      <div>
        <p className="mb-1 text-xs font-bold text-amber-700 uppercase">Datos faltantes</p>
        <ul className="list-disc pl-4 text-xs">{r.faltantes.map((b) => <li key={b}>{b}</li>)}</ul>
      </div>
    </div>
  );
}

export default function Simulador() {
  const [scen, setScen] = useState(INITIAL);
  const [costos, setCostos] = useState(defaultCosts);
  const [params, setParams] = useState<ScenarioParams>(DEFAULT_PARAMS);
  const results = scen.map((s) => evaluate({ ...s, costos, params }));
  const [a, b] = results;
  const diff = (x: number, y: number) => (x === y ? "=" : x > y ? "A" : "B");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        modulo="Módulo 04 · Pantalla 3"
        title="Simulador de Decisiones"
        subtitle="Compará dos alternativas hipotéticas de inversión territorial. Los resultados son estimaciones con supuestos explícitos, no impactos comprobados."
      >
        <DemoBadge />
      </PageHeader>
      <Notice tone="warn" title="Cómo leer este simulador">
        Localidades y población departamental provienen de fuentes oficiales (Georef, Censo 2022 vía IDESA). Los costos unitarios y las tasas son
        supuestos del equipo, editables abajo; no son presupuestos oficiales. La población es la de los departamentos alcanzados (no por localidad).
      </Notice>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {scen.map((s, k) => (
          <div key={k} className="card p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${k === 0 ? "bg-navy-800" : "bg-eco-600"}`}>
                {k === 0 ? "A" : "B"}
              </span>
              <p className="text-xs text-slate-500">Configuración del escenario</p>
            </div>
            <ScenarioEditor s={s} onChange={(n) => setScen((all) => all.map((x, i) => (i === k ? n : x)))} />
            <hr className="my-4 border-slate-200" />
            <Result r={results[k]} presupuesto={s.presupuestoUsd} />
          </div>
        ))}
      </div>

      <div className="card mt-4 overflow-x-auto p-4">
        <h2 className="mb-2 font-bold text-navy-900">Comparación A vs. B</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="py-1">Criterio</th>
              <th>A</th>
              <th>B</th>
              <th>Mayor</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Cobertura territorial (localidades)", a.locs.length, b.locs.length],
              ["Población de referencia", a.poblacionRef, b.poblacionRef],
              ["Dimensiones involucradas", a.dimensiones.length, b.dimensiones.length],
              ["ODS relacionados", a.ods.length, b.ods.length],
              ["Indicadores relacionados", a.indicadores.length, b.indicadores.length],
              ["Costo estimado (USD)", a.costoTotal, b.costoTotal],
              ["Riesgos identificados", a.riesgos.length, b.riesgos.length],
              ["Datos faltantes", a.faltantes.length, b.faltantes.length],
            ].map(([label, x, y]) => (
              <tr key={label as string} className="border-t border-slate-100">
                <td className="py-1.5">{label}</td>
                <td>{(x as number).toLocaleString("es-AR")}</td>
                <td>{(y as number).toLocaleString("es-AR")}</td>
                <td className="font-semibold">{diff(x as number, y as number)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-slate-500">«Mayor» no significa «mejor»: más costo, riesgos o datos faltantes son desfavorables. La decisión requiere juicio de los actores.</p>
      </div>

      <details className="card mt-4 p-4">
        <summary className="cursor-pointer font-semibold text-navy-900">Supuestos del modelo (editables)</summary>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
          {INTERVENTIONS.map((i) => (
            <label key={i.id} className="block">
              <span className="text-xs text-slate-500">
                {i.nombre} — USD por unidad ({i.unidad})
              </span>
              <input
                type="number"
                min={0}
                value={costos[i.id as InterventionId]}
                onChange={(e) => setCostos((c) => ({ ...c, [i.id]: Math.max(0, Number(e.target.value)) }))}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
              />
            </label>
          ))}
          <label className="block">
            <span className="text-xs text-slate-500">Capacitación — tasa de participación sobre población (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={params.tasaParticipacion * 100}
              onChange={(e) => setParams((p) => ({ ...p, tasaParticipacion: Math.max(0, Number(e.target.value)) / 100 }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">Proveedores acompañados por localidad</span>
            <input
              type="number"
              min={0}
              value={params.proveedoresPorLocalidad}
              onChange={(e) => setParams((p) => ({ ...p, proveedoresPorLocalidad: Math.max(0, Number(e.target.value)) }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5"
            />
          </label>
        </div>
      </details>
    </div>
  );
}
