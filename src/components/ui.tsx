import type { ValidationStatus } from "@/lib/types";
import { VALIDATION_HELP, VALIDATION_LABEL } from "@/lib/status";
import { ODS_INFO } from "@/data/indicators";

export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title="Cifra o entidad sintética creada para la demostración"
      className={`inline-flex items-center rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-amber-800 uppercase ${className}`}
    >
      Simulación / dato demostrativo
    </span>
  );
}

export function OfficialBadge({ label = "Dato oficial", className = "" }: { label?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md border border-sky-300 bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-sky-800 uppercase ${className}`}>
      {label}
    </span>
  );
}

const VAL_STYLE: Record<ValidationStatus, string> = {
  declarado: "bg-slate-100 text-slate-700 border-slate-300",
  documentado: "bg-indigo-50 text-indigo-800 border-indigo-300",
  contrastado: "bg-teal-50 text-teal-800 border-teal-300",
  verificado: "bg-emerald-50 text-emerald-800 border-emerald-400",
};

export function ValidationBadge({ status }: { status: ValidationStatus }) {
  return (
    <span title={VALIDATION_HELP[status]} className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${VAL_STYLE[status]}`}>
      {VALIDATION_LABEL[status]}
    </span>
  );
}

export function OdsChip({ n }: { n: number }) {
  const info = ODS_INFO[n];
  return (
    <span
      title={info ? `ODS ${n}: ${info.nombre}` : `ODS ${n}`}
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-bold text-white"
      style={{ background: info?.color ?? "#64748b" }}
    >
      ODS {n}
    </span>
  );
}

export function StatusPill({ tone, children }: { tone: "ok" | "warn" | "bad" | "neutral" | "info"; children: React.ReactNode }) {
  const t = {
    ok: "bg-emerald-50 text-emerald-800 border-emerald-300",
    warn: "bg-amber-50 text-amber-800 border-amber-300",
    bad: "bg-rose-50 text-rose-800 border-rose-300",
    neutral: "bg-slate-100 text-slate-700 border-slate-300",
    info: "bg-sky-50 text-sky-800 border-sky-300",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${t}`}>{children}</span>;
}

export function PageHeader({ modulo, title, subtitle, children }: { modulo: string; title: string; subtitle: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-bold tracking-widest text-eco-700 uppercase">{modulo}</p>
        <h1 className="mt-1 text-2xl font-bold text-navy-900 md:text-3xl">{title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

export function Notice({ tone = "info", title, children }: { tone?: "info" | "warn" | "bad" | "ok"; title?: string; children: React.ReactNode }) {
  const t = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    warn: "border-amber-200 bg-amber-50 text-amber-900",
    bad: "border-rose-200 bg-rose-50 text-rose-900",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${t}`}>
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-0.5" : ""}>{children}</div>
    </div>
  );
}

export function Mono({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <code className={`font-mono text-[12px] break-all ${className}`}>{children}</code>;
}
