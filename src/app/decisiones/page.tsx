"use client";

import Link from "next/link";
import { DemoBadge, Mono, Notice, PageHeader, StatusPill } from "@/components/ui";
import { actorName, commitmentById, commitments, decisions, evidences, risks } from "@/data/demo";
import { indicatorById, indicators } from "@/data/indicators";
import { progress } from "@/lib/iet";
import { effectiveStatus, fmtDate } from "@/lib/status";
import { useStore } from "@/lib/store";

const HREF: Record<string, string> = { indicador: "/diagnostico", evidencia: "/pasaporte", riesgo: "/gestion", escenario: "/simulador", compromiso: "/pasaporte" };

function groundLabel(tipo: string, id: string) {
  if (tipo === "indicador") return indicatorById(id)?.nombre ?? id;
  if (tipo === "compromiso") return commitmentById(id)?.titulo ?? id;
  if (tipo === "riesgo") return risks.find((r) => r.id === id)?.titulo ?? id;
  if (tipo === "evidencia") return evidences.find((e) => e.id === id)?.titulo ?? id;
  return id;
}

export default function Decisiones() {
  const { observations } = useStore();
  const alerts: { tone: "bad" | "warn"; title: string; detail: string; href: string }[] = [
    ...commitments
      .filter((c) => effectiveStatus(c) === "vencido")
      .map((c) => ({ tone: "bad" as const, title: `${c.id} vencido`, detail: `${c.titulo} — límite ${fmtDate(c.fechaLimite)}, avance declarado ${c.avance}%.`, href: "/gestion" })),
    ...risks
      .filter((r) => r.probabilidad * r.impacto >= 12 && r.estado !== "cerrado")
      .map((r) => ({ tone: "warn" as const, title: `Riesgo alto ${r.id}`, detail: `${r.titulo} (nivel ${r.probabilidad * r.impacto}).`, href: "/gestion" })),
    ...observations
      .filter((o) => o.estado === "recibida")
      .map((o) => ({ tone: "warn" as const, title: `Observación ${o.id} sin respuesta`, detail: o.texto, href: "/participacion" })),
  ];
  const gaps = indicators
    .map((i) => ({ i, p: progress(i) }))
    .filter((x) => x.p !== null && x.p < 0.5)
    .sort((a, b) => a.p! - b.p!);
  const weak = commitments.filter((c) => !evidences.some((e) => e.commitmentId === c.id && e.validacion !== "declarado"));

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        modulo="Módulo 08"
        title="Centro de Decisiones"
        subtitle="Hallazgos, alertas y prioridades derivados de reglas explícitas sobre los datos, y decisiones con fundamentos trazables hasta indicadores, evidencias y riesgos."
      >
        <DemoBadge />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4">
          <h2 className="mb-2 font-bold text-navy-900">Alertas ({alerts.length})</h2>
          <ul className="space-y-2 text-sm">
            {alerts.map((a) => (
              <li key={a.title}>
                <Link href={a.href} className={`block rounded-lg border-l-4 p-2 hover:bg-canvas ${a.tone === "bad" ? "border-rose-500" : "border-amber-400"}`}>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs text-slate-600">{a.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">Reglas: compromiso no cumplido con plazo vencido; riesgo con P×I ≥ 12; observación sin respuesta.</p>
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-bold text-navy-900">Brechas prioritarias</h2>
          <ul className="space-y-2 text-sm">
            {gaps.map(({ i, p }) => (
              <li key={i.id}>
                <div className="flex justify-between gap-2">
                  <span>{i.nombre}</span>
                  <span className="font-semibold">{Math.round(p! * 100)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100">
                  <div className="h-1.5 rounded-full bg-amber-500" style={{ width: `${p! * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">Indicadores con progreso hacia la meta menor al 50%. Prioridad sugerida, no causal.</p>
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-bold text-navy-900">Compromisos sin evidencia documentada</h2>
          <ul className="space-y-1 text-sm">
            {weak.map((c) => (
              <li key={c.id}>
                <Link href="/pasaporte" className="hover:underline">
                  <Mono className="text-[11px]">{c.id}</Mono> {c.titulo}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-slate-500">Solo hay declaraciones del responsable: conviene solicitar evidencia con huella.</p>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-xl font-bold text-navy-900">Decisiones registradas</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {decisions.map((d) => (
          <div key={d.id} className="card p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Mono>{d.id}</Mono>
              <StatusPill tone={d.estado === "aprobada" ? "ok" : d.estado === "en_revision" ? "warn" : "info"}>{d.estado.replace("_", " ")}</StatusPill>
              <span className="text-slate-500">{fmtDate(d.fecha)}</span>
            </div>
            <h3 className="mt-2 font-semibold text-navy-900">{d.titulo}</h3>
            <p className="text-sm text-slate-600">{d.descripcion}</p>
            <p className="mt-1 text-xs text-slate-500">{actorName(d.actorId)}</p>
            <p className="mt-3 text-xs font-bold text-slate-500 uppercase">Fundamentos</p>
            <ul className="mt-1 space-y-1 text-xs">
              {d.fundamentos.map((f) => (
                <li key={f.tipo + f.id}>
                  <Link href={HREF[f.tipo]} className="hover:underline">
                    <span className="rounded bg-navy-100 px-1 font-semibold text-navy-800">{f.tipo}</span> {groundLabel(f.tipo, f.id)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Notice tone="info">Las decisiones son del caso demostrativo. El sistema no decide: ordena la información para que los actores decidan con fundamentos verificables.</Notice>
      </div>
    </div>
  );
}
