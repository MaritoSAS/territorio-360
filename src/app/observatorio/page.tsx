"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import indicadores from "@/data/open/indicadores-departamentales.json";
import localidades from "@/data/open/localidades-salta.json";
import deptosMeta from "@/data/open/departamentos-salta.json";
import { commitments, projects, risks, territories } from "@/data/demo";
import { BASEMAPS, WMS_LAYERS } from "@/data/layers";
import { DemoBadge, OfficialBadge, OdsChip, PageHeader, StatusPill } from "@/components/ui";
import { effectiveStatus, STATUS_LABEL } from "@/lib/status";
import { CHOROPLETH, PALETTE, quantileBreaks, type ChoroplethKey } from "./choropleth";

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-sm text-slate-500">Cargando mapa…</div>,
});

const fmt = (n: number) => n.toLocaleString("es-AR");

function territoryIdsFor(depto: string | null, locNombre: string | null) {
  return territories
    .filter((t) => (locNombre ? t.nombre === locNombre : t.departamento === depto || t.nombre === depto))
    .map((t) => t.id)
    .concat(depto === "Los Andes" && !locNombre ? ["AREA-PDP"] : []);
}

export default function Observatorio() {
  const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("osm");
  const [activeWms, setActiveWms] = useState<string[]>(WMS_LAYERS.filter((l) => l.defaultOn).map((l) => l.id));
  const [choropleth, setChoropleth] = useState<ChoroplethKey>("salud_cada_10k_hab");
  const [showLocalidades, setShowLocalidades] = useState(true);
  const [showProject, setShowProject] = useState(true);
  const [depto, setDepto] = useState<string | null>("Los Andes");
  const [locId, setLocId] = useState<string | null>(null);

  const loc = localidades.localidades.find((l) => l.id === locId) ?? null;
  const row = indicadores.filas.find((f) => f.departamento === (loc?.departamento ?? depto));
  const ids = useMemo(() => territoryIdsFor(loc?.departamento ?? depto, loc?.nombre ?? null), [depto, loc]);
  const relCommitments = commitments.filter((c) => c.territorioIds.some((t) => ids.includes(t)));
  const relRisks = risks.filter((r) => r.territorioIds.some((t) => ids.includes(t)));
  const relProjects = projects.filter((p) => p.territorioIds.some((t) => ids.includes(t)));
  const locsInDepto = localidades.localidades.filter((l) => l.departamento === (loc?.departamento ?? depto));
  const breaks = choropleth !== "none" ? quantileBreaks(choropleth) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        modulo="Módulo 01 · Pantalla 1"
        title="Observatorio Territorial"
        subtitle="Capas oficiales de IDESA servidas en vivo, localidades de Georef y fichas territoriales. Hacé clic en un departamento o localidad."
      />
      <div className="grid gap-4 lg:grid-cols-[260px_1fr_340px]">
        <aside className="card space-y-5 p-4 text-sm">
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Mapa base</p>
            {Object.entries(BASEMAPS).map(([k, b]) => (
              <label key={k} className="flex items-center gap-2 py-0.5">
                <input type="radio" name="bm" checked={basemap === k} onChange={() => setBasemap(k as keyof typeof BASEMAPS)} />
                {b.nombre}
              </label>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Indicador por departamento</p>
            <select className="w-full rounded-md border border-slate-300 px-2 py-1.5" value={choropleth} onChange={(e) => setChoropleth(e.target.value as ChoroplethKey)}>
              {Object.entries(CHOROPLETH).map(([k, c]) => (
                <option key={k} value={k}>
                  {c.nombre} ({c.unidad})
                </option>
              ))}
              <option value="none">Sin coloreo</option>
            </select>
            {choropleth !== "none" && (
              <div className="mt-2">
                <div className="flex">
                  {PALETTE.map((c) => (
                    <span key={c} className="h-2.5 flex-1" style={{ background: c }} />
                  ))}
                </div>
                <div className="mt-0.5 flex justify-between text-[10px] text-slate-500">
                  <span>menor</span>
                  <span>quintiles: {breaks.map((b) => fmt(b)).join(" · ")}</span>
                  <span>mayor</span>
                </div>
              </div>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Capas IDESA (WMS en vivo)</p>
            {WMS_LAYERS.map((l) => (
              <label key={l.id} className="flex items-start gap-2 py-0.5">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={activeWms.includes(l.id)}
                  onChange={(e) => setActiveWms((a) => (e.target.checked ? [...a, l.id] : a.filter((x) => x !== l.id)))}
                />
                <span>
                  {l.nombre}
                  <span className="block text-[11px] text-slate-400">{l.grupo}</span>
                </span>
              </label>
            ))}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold tracking-wide text-slate-500 uppercase">Otras capas</p>
            <label className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={showLocalidades} onChange={(e) => setShowLocalidades(e.target.checked)} />
              Localidades ({localidades.localidades.length}, Georef)
            </label>
            <label className="flex items-center gap-2 py-0.5">
              <input type="checkbox" checked={showProject} onChange={(e) => setShowProject(e.target.checked)} />
              Proyecto demostrativo <span className="text-[10px] font-bold text-amber-700">DEMO</span>
            </label>
          </div>
          <p className="text-[11px] leading-snug text-slate-500">
            Si una capa WMS no aparece, el servidor de IDESA puede estar lento: el resto del mapa sigue operativo. Los límites se descargaron el{" "}
            {deptosMeta.meta.descargado.slice(0, 10)}.
          </p>
        </aside>

        <div className="card h-[560px] overflow-hidden lg:h-auto lg:min-h-[640px]">
          <MapView
            basemap={basemap}
            activeWms={activeWms}
            choropleth={choropleth}
            showLocalidades={showLocalidades}
            showProject={showProject}
            selectedDepto={loc?.departamento ?? depto}
            onSelectDepto={(n) => {
              setDepto(n);
              setLocId(null);
            }}
            onSelectLocalidad={(id) => setLocId(id)}
          />
        </div>

        <aside className="card space-y-4 p-4 text-sm">
          <div>
            <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Ficha territorial</p>
            <h2 className="mt-1 text-xl font-bold text-navy-900">{loc ? loc.nombre : depto ? `Departamento ${depto}` : "Seleccioná un territorio"}</h2>
            {loc && (
              <p className="text-xs text-slate-500">
                Localidad · Depto. {loc.departamento} · Municipio {loc.municipio ?? "—"} · {loc.lat.toFixed(3)}, {loc.lon.toFixed(3)}
              </p>
            )}
          </div>
          {row && (
            <div className="rounded-lg border border-sky-100 bg-sky-50/50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-sky-900">Departamento {row.departamento}</p>
                <OfficialBadge />
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                <dt className="text-slate-500">Población 2022</dt>
                <dd className="text-right font-semibold">{fmt(row.poblacion_2022)}</dd>
                <dt className="text-slate-500">Densidad</dt>
                <dd className="text-right font-semibold">{row.densidad_hab_km2} hab/km²</dd>
                <dt className="text-slate-500">Est. de salud</dt>
                <dd className="text-right font-semibold">
                  {row.establecimientos_salud} ({row.salud_cada_10k_hab} c/10k)
                </dd>
                <dt className="text-slate-500">Est. educativos</dt>
                <dd className="text-right font-semibold">
                  {row.establecimientos_educativos} ({row.educativos_cada_10k_hab} c/10k)
                </dd>
                <dt className="text-slate-500">Localidades Georef</dt>
                <dd className="text-right font-semibold">{locsInDepto.length}</dd>
              </dl>
              <p className="mt-2 text-[10px] text-slate-500">Fuente: IDESA (Censo 2022, establecimientos) y Georef. Conteos de cálculo propio.</p>
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-xs font-bold tracking-wide text-slate-500 uppercase">Grafo territorial</p>
              {(relProjects.length > 0 || relCommitments.length > 0) && <DemoBadge />}
            </div>
            {relProjects.length === 0 && relCommitments.length === 0 ? (
              <p className="text-xs text-slate-500">Sin proyectos ni compromisos registrados para este territorio.</p>
            ) : (
              <div className="space-y-3">
                {relProjects.map((p) => (
                  <div key={p.id} className="rounded-lg border border-eco-100 bg-eco-100/40 p-2.5">
                    <p className="text-xs font-semibold text-eco-700">Proyecto {p.id}</p>
                    <p className="text-sm font-medium">{p.nombre}</p>
                  </div>
                ))}
                {relCommitments.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-600">Compromisos ({relCommitments.length})</p>
                    <ul className="space-y-1.5">
                      {relCommitments.map((c) => {
                        const st = effectiveStatus(c);
                        return (
                          <li key={c.id} className="flex items-start justify-between gap-2 text-xs">
                            <span>
                              <b>{c.id}</b> {c.titulo}
                              <span className="mt-0.5 flex gap-1">
                                {c.ods.map((o) => (
                                  <OdsChip key={o} n={o} />
                                ))}
                              </span>
                            </span>
                            <StatusPill tone={st === "vencido" ? "bad" : st === "cumplido" ? "ok" : "info"}>{STATUS_LABEL[st]}</StatusPill>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
                {relRisks.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold text-slate-600">Riesgos vinculados ({relRisks.length})</p>
                    <ul className="list-disc pl-4 text-xs text-slate-700">
                      {relRisks.map((r) => (
                        <li key={r.id}>
                          {r.titulo} <span className="text-slate-400">(P{r.probabilidad}×I{r.impacto})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Link href="/pasaporte" className="btn btn-primary w-full">
                  Ver evidencias en el Pasaporte →
                </Link>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
