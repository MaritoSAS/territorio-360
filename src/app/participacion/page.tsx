"use client";

import { useState } from "react";
import { DemoBadge, Mono, Notice, PageHeader, StatusPill } from "@/components/ui";
import { actorName, commitmentById, commitments, territories, territoryName } from "@/data/demo";
import { can, roleInfo } from "@/lib/roles";
import { fmtDate } from "@/lib/status";
import { useStore } from "@/lib/store";

export default function Participacion() {
  const { role, observations, addObservation, respondObservation } = useStore();
  const [cmp, setCmp] = useState("CMP-01");
  const [terr, setTerr] = useState("LOC-OLACAPATO");
  const [text, setText] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const canCreate = can(role, "observation:create");
  const canRespond = can(role, "observation:respond");
  const pending = observations.filter((o) => o.estado === "recibida").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        modulo="Módulo 06"
        title="Participación Territorial"
        subtitle="Las comunidades presentan aportes y observaciones vinculados a compromisos y territorios; el gobierno responde y la respuesta queda en el historial."
      />
      <div className="mb-4 grid grid-cols-3 gap-3 text-center">
        <div className="card p-3">
          <p className="text-2xl font-bold text-navy-900">{observations.length}</p>
          <p className="text-xs text-slate-500">observaciones</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-amber-600">{pending}</p>
          <p className="text-xs text-slate-500">sin respuesta</p>
        </div>
        <div className="card p-3">
          <p className="text-2xl font-bold text-eco-700">{observations.length - pending}</p>
          <p className="text-xs text-slate-500">respondidas</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        <div className="card p-4">
          <h2 className="font-bold text-navy-900">Nueva observación</h2>
          {!canCreate ? (
            <p className="mt-2 text-sm text-slate-600">Cambiá al rol Comunidad para presentar una observación. Rol actual: {roleInfo(role).nombre}.</p>
          ) : (
            <form
              className="mt-3 space-y-3 text-sm"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                addObservation({ actorId: roleInfo(role).actorId, commitmentId: cmp, territorioId: terr, texto: text.trim() });
                setText("");
              }}
            >
              <label className="block">
                <span className="text-xs text-slate-500">Compromiso</span>
                <select value={cmp} onChange={(e) => setCmp(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5">
                  {commitments.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.id} — {c.titulo}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Territorio</span>
                <select value={terr} onChange={(e) => setTerr(e.target.value)} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5">
                  {territories
                    .filter((t) => t.tipo === "localidad")
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nombre}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">Observación o aporte</span>
                <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={600} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5" />
              </label>
              <Notice tone="warn">No incluyas datos personales sensibles. En este MVP la observación se guarda solo en este navegador.</Notice>
              <button className="btn btn-primary" disabled={!text.trim()}>
                Presentar observación
              </button>
            </form>
          )}
        </div>

        <div className="space-y-3">
          {observations.map((o) => (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Mono>{o.id}</Mono>
                <StatusPill tone={o.estado === "respondida" ? "ok" : "warn"}>{o.estado === "respondida" ? "Respondida" : "Recibida"}</StatusPill>
                <span className="text-slate-500">
                  {fmtDate(o.fecha)} · {actorName(o.actorId)}
                </span>
                {o.demo ? <DemoBadge /> : <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">Cargada en este navegador</span>}
              </div>
              <p className="mt-2 text-sm">{o.texto}</p>
              <p className="mt-1 text-xs text-slate-500">
                {o.commitmentId && `${o.commitmentId} — ${commitmentById(o.commitmentId)?.titulo}`}
                {o.territorioId && ` · ${territoryName(o.territorioId)}`}
              </p>
              {o.respuesta && (
                <div className="mt-2 rounded-lg border-l-4 border-eco-500 bg-eco-100/40 p-2 text-sm">
                  <span className="text-xs font-semibold text-eco-700">Respuesta:</span> {o.respuesta}
                </div>
              )}
              {o.estado === "recibida" && canRespond && (
                <form
                  className="mt-2 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const r = answers[o.id]?.trim();
                    if (r) respondObservation(o.id, r);
                  }}
                >
                  <input
                    value={answers[o.id] ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [o.id]: e.target.value }))}
                    placeholder="Responder como Gobierno…"
                    className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                  <button className="btn btn-primary" disabled={!answers[o.id]?.trim()}>
                    Responder
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
