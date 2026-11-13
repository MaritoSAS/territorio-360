"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ROLES } from "@/lib/roles";
import { useStore } from "@/lib/store";
import type { Role } from "@/lib/types";

export const NAV = [
  { href: "/observatorio", label: "Observatorio", modulo: "01" },
  { href: "/diagnostico", label: "Diagnóstico", modulo: "02–03" },
  { href: "/simulador", label: "Simulador", modulo: "04" },
  { href: "/gestion", label: "Gestión SGI", modulo: "05" },
  { href: "/participacion", label: "Participación", modulo: "06" },
  { href: "/pasaporte", label: "Pasaporte de Impacto", modulo: "07" },
  { href: "/decisiones", label: "Centro de Decisiones", modulo: "08" },
  { href: "/estado", label: "Estado técnico", modulo: "" },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="#0b2545" />
        <path d="M6 26c6-6 10-2 14-8s9-6 14-2" stroke="#1fae8d" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="20" cy="20" r="18" fill="none" stroke="#1fae8d" strokeWidth="1.5" strokeDasharray="3 3" />
      </svg>
      <div className="leading-tight">
        <p className="text-[15px] font-extrabold tracking-tight text-white">TERRITORIO 360</p>
        <p className="text-[10px] font-medium tracking-wide text-sky-200">Territorial Intelligence & Impact OS</p>
      </div>
    </Link>
  );
}

function RoleSelect() {
  const { role, setRole, log } = useStore();
  return (
    <label className="flex items-center gap-2 text-xs text-sky-100">
      <span className="hidden sm:inline">Rol</span>
      <select
        value={role}
        onChange={(e) => {
          setRole(e.target.value as Role);
          log({ accion: `cambió a rol ${e.target.value}`, entidad: "session", entidadId: "-" });
        }}
        className="rounded-md border border-white/20 bg-navy-800 px-2 py-1 text-xs font-semibold text-white"
        title="Simulación de roles: no hay autenticación real en el MVP"
      >
        {ROLES.map((r) => (
          <option key={r.id} value={r.id}>
            {r.nombre}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-[1000] bg-navy-950 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
          <Logo />
          <div className="flex items-center gap-3">
            <RoleSelect />
            <button className="rounded-md border border-white/20 px-2 py-1 text-sm text-white lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menú">
              ☰
            </button>
          </div>
        </div>
        <nav className={`${open ? "block" : "hidden"} border-t border-white/10 bg-navy-900 lg:block`}>
          <ul className="mx-auto flex max-w-7xl flex-col px-2 lg:flex-row lg:items-center lg:gap-1 lg:px-4">
            {NAV.map((n) => {
              const active = path.startsWith(n.href);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium ${
                      active ? "bg-white/10 text-white" : "text-sky-100/80 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {n.modulo && <span className="font-mono text-[10px] text-eco-500">{n.modulo}</span>}
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 text-xs text-slate-500 md:flex-row md:justify-between">
          <p>
            Territorio 360 — MVP para Argentina Space Hackathon 2026 · Track Blockchain (Avalanche × Oracle). Los datos marcados como{" "}
            <b className="text-amber-700">SIMULACIÓN / DATO DEMOSTRATIVO</b> son sintéticos.
          </p>
          <p>Datos abiertos: IDESA (Salta), Georef API (datos.gob.ar), © colaboradores de OpenStreetMap.</p>
        </div>
      </footer>
    </div>
  );
}
