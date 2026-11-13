"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auditSeed, observations as obsSeed } from "@/data/demo";
import { roleInfo } from "@/lib/roles";
import type { AuditEvent, Observation, Role } from "@/lib/types";

/** Registro local de una evidencia presentada desde el Pasaporte de Impacto. */
export interface EvidenceSubmission {
  id: string;
  commitmentId: string;
  projectId: string;
  fileName: string;
  fileSize: number;
  sha256: string;
  createdAt: string;
  role: Role;
  ociObject?: { name: string; url?: string; uploadedAt: string } | null;
  tx?: { hash: string; chainId: number; contract: string; status: "pending" | "confirmed" | "failed"; blockNumber?: number; from?: string } | null;
}

interface StoreState {
  role: Role;
  setRole: (r: Role) => void;
  submissions: EvidenceSubmission[];
  upsertSubmission: (s: EvidenceSubmission) => void;
  observations: Observation[];
  addObservation: (o: Omit<Observation, "id" | "fecha" | "estado" | "demo">) => void;
  respondObservation: (id: string, respuesta: string) => void;
  audit: AuditEvent[];
  log: (e: Omit<AuditEvent, "id" | "fecha" | "actor" | "rol">) => void;
  contractOverride: string | null;
  setContractOverride: (a: string | null) => void;
  resetDemo: () => void;
  hydrated: boolean;
}

const Ctx = createContext<StoreState | null>(null);
const KEY = "t360:v1";

interface Persisted {
  role: Role;
  submissions: EvidenceSubmission[];
  observations: Observation[];
  audit: AuditEvent[];
  contractOverride: string | null;
}

const initial = (): Persisted => ({ role: "empresa", submissions: [], observations: obsSeed, audit: auditSeed, contractOverride: null });

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...initial(), ...JSON.parse(raw) });
    } catch {
      /* almacenamiento corrupto: se usa el estado inicial */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const log = useCallback<StoreState["log"]>((e) => {
    setState((s) => ({
      ...s,
      audit: [
        { ...e, id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, fecha: new Date().toISOString(), actor: roleInfo(s.role).nombre, rol: s.role },
        ...s.audit,
      ],
    }));
  }, []);

  const value = useMemo<StoreState>(
    () => ({
      ...state,
      hydrated,
      setRole: (role) => {
        setState((s) => ({ ...s, role }));
      },
      upsertSubmission: (sub) =>
        setState((s) => {
          const exists = s.submissions.some((x) => x.id === sub.id);
          return { ...s, submissions: exists ? s.submissions.map((x) => (x.id === sub.id ? sub : x)) : [sub, ...s.submissions] };
        }),
      addObservation: (o) => {
        const id = `OBS-${Date.now().toString(36).toUpperCase()}`;
        setState((s) => ({ ...s, observations: [{ ...o, id, fecha: new Date().toISOString().slice(0, 10), estado: "recibida", demo: false }, ...s.observations] }));
        log({ accion: "presentó observación", entidad: "observation", entidadId: id });
      },
      respondObservation: (id, respuesta) => {
        setState((s) => ({ ...s, observations: s.observations.map((o) => (o.id === id ? { ...o, estado: "respondida", respuesta } : o)) }));
        log({ accion: "respondió observación", entidad: "observation", entidadId: id });
      },
      log,
      setContractOverride: (contractOverride) => setState((s) => ({ ...s, contractOverride })),
      resetDemo: () => setState({ ...initial(), contractOverride: state.contractOverride }),
    }),
    [state, hydrated, log]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fuera de StoreProvider");
  return v;
}
