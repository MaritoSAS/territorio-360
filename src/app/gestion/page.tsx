"use client";

import { DemoBadge, Mono, Notice, OdsChip, PageHeader, StatusPill } from "@/components/ui";
import { actorName, commitments, correctiveActions, evidences, risks, sgiObjectives } from "@/data/demo";
import { can } from "@/lib/roles";
import { effectiveStatus, fmtDate, STATUS_LABEL } from "@/lib/status";
import { useStore } from "@/lib/store";
import type { CommitmentStatus } from "@/lib/types";

const TONE: Record<CommitmentStatus, "ok" | "warn" | "bad" | "info"> = { cumplido: "ok", en_curso: "info", pendiente: "warn", vencido: "bad" };
const level = (p: number, i: number) => p * i;
const cellColor = (v: number) => (v >= 15 ? "bg-rose-500 text-white" : v >= 8 ? "bg-amber-400" : v >= 4 ? "bg-yellow-200" : "bg-eco-100");

export default function Gestion() {
  const { role, submissions, audit } = useStore();
  const detail = can(role, "risk:view_detail");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        modulo="Módulo 05"
        title="Gestión SGI"
        subtitle="Objetivos, compromisos, responsables, plazos, riesgos, evidencias y acciones correctivas. Inspirado en ISO 9001 / 14001 / 45001 / 37001 y GRI como referencia: no implica certificación ni conformidad."
      >
        <DemoBadge />
      </PageHeader>

      {sgiObjectives.map((o) => {
        const cs = commitments.filter((c) => c.objetivoId === o.id);
        if (!cs.length) return null;
        return (
          <section key={o.id} className="card mb-4 overflow-x-auto p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <h2 className="font-bold text-navy-900">{o.titulo}</h2>
              <span className="text-xs text-slate-500">ref. {o.norma}</span>
            </div>
            <p className="text-sm text-slate-600">{o.descripcion}</p>
            <table className="mt-3 w-full min-w-[760px] text-sm">
              <thead className="text-left text-xs text-slate-500 uppercase">
                <tr>
                  <th className="py-1">Compromiso</th>
                  <th>Responsable</th>
                  <th>Plazo</th>
                  <th>Estado</th>
                  <th>Avance</th>
                  <th>Evidencias</th>
                  <th>ODS</th>
                </tr>
              </thead>
              <tbody>
                {cs.map((c) => {
                  const st = effectiveStatus(c);
                  const nEv = evidences.filter((e) => e.commitmentId === c.id).length + submissions.filter((s) => s.commitmentId === c.id).length;
                  return (
                    <tr key={c.id} className="border-t border-slate-100">
                      <td className="py-2">
                        <Mono className="text-[11px]">{c.id}</Mono> {c.titulo}
                      </td>
                      <td className="text-xs">
                        {actorName(c.responsableActorId)}
                        <br />
                        <span className="text-slate-500">{c.responsableCargo}</span>
                      </td>
                      <td className="text-xs">{fmtDate(c.fechaLimite)}</td>
                      <td>
                        <StatusPill tone={TONE[st]}>{STATUS_LABEL[st]}</StatusPill>
                      </td>
                      <td className="w-28">
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div className="h-1.5 rounded-full bg-navy-700" style={{ width: `${c.avance}%` }} />
                        </div>
                        <span className="text-[11px] text-slate-500">{c.avance}% declarado</span>
                      </td>
                      <td className="text-center">{nEv}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {c.ods.map((n) => (
                            <OdsChip key={n} n={n} />
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      <div className="mt-6 grid gap-4 lg:grid-cols-[auto_1fr]">
        <div className="card p-4">
          <h2 className="mb-2 font-bold text-navy-900">Matriz de riesgos</h2>
          <div className="grid grid-cols-[auto_repeat(5,2.5rem)] gap-1 text-center text-[11px]">
            {[5, 4, 3, 2, 1].map((p) => (
              <div key={p} className="contents">
                <div className="flex items-center pr-1 text-slate-500">P{p}</div>
                {[1, 2, 3, 4, 5].map((i) => {
                  const here = risks.filter((r) => r.probabilidad === p && r.impacto === i);
                  return (
                    <div key={i} className={`flex h-10 items-center justify-center rounded font-bold ${cellColor(level(p, i))}`} title={here.map((r) => r.titulo).join(", ")}>
                      {here.map((r) => r.id.replace("R-0", "R")).join(" ")}
                    </div>
                  );
                })}
              </div>
            ))}
            <div />
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="text-slate-500">
                I{i}
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Nivel = probabilidad × impacto (escala 1–5).</p>
        </div>

        <div className="card overflow-x-auto p-4">
          <h2 className="mb-2 font-bold text-navy-900">Registro de riesgos</h2>
          {!detail && (
            <Notice tone="info">Con el rol Comunidad se muestra el resumen; el tratamiento detallado lo ven Gobierno, Empresa y Administrador.</Notice>
          )}
          <table className="mt-2 w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs text-slate-500 uppercase">
              <tr>
                <th className="py-1">Riesgo</th>
                <th>Categoría</th>
                <th>Nivel</th>
                <th>Estado</th>
                {detail && <th>Tratamiento / responsable</th>}
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 align-top">
                  <td className="py-2">
                    <Mono className="text-[11px]">{r.id}</Mono> {r.titulo}
                  </td>
                  <td className="text-xs capitalize">{r.categoria}</td>
                  <td>
                    <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${cellColor(level(r.probabilidad, r.impacto))}`}>{level(r.probabilidad, r.impacto)}</span>
                  </td>
                  <td className="text-xs">{r.estado.replace("_", " ")}</td>
                  {detail && (
                    <td className="text-xs">
                      {r.tratamiento}
                      <br />
                      <span className="text-slate-500">
                        {actorName(r.responsableActorId)} · {r.referenciasIso.join(", ")}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-2 font-bold text-navy-900">Acciones correctivas</h2>
          <ul className="divide-y divide-slate-100 text-sm">
            {correctiveActions.map((a) => (
              <li key={a.id} className="py-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Mono className="text-[11px]">{a.id}</Mono>
                  <span>{a.descripcion}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Origen: {a.origen.tipo} {a.origen.id} · {actorName(a.responsableActorId)} · límite {fmtDate(a.fechaLimite)} · {a.estado.replace("_", " ")}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-bold text-navy-900">Historial de cambios</h2>
          {can(role, "audit:view") ? (
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto text-xs">
              {audit.slice(0, 30).map((a) => (
                <li key={a.id} className="py-1.5">
                  <span className="text-slate-400">{new Date(a.fecha).toLocaleString("es-AR")}</span> · <b>{a.actor}</b> {a.accion} · <Mono>{a.entidadId}</Mono>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-600">El historial completo lo ven Gobierno y Administrador.</p>
          )}
        </div>
      </div>
    </div>
  );
}
