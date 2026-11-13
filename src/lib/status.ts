import type { Commitment, CommitmentStatus, ValidationStatus } from "@/lib/types";

/** Fecha de corte: la fecha actual del sistema. */
export const today = () => new Date().toISOString().slice(0, 10);

/** Un compromiso no cumplido cuya fecha límite pasó se considera vencido. */
export function effectiveStatus(c: Commitment, ref = today()): CommitmentStatus {
  if (c.estado === "cumplido" || c.avance >= 100) return "cumplido";
  if (c.fechaLimite < ref) return "vencido";
  return c.estado;
}

export const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  declarado: "Declarado",
  documentado: "Documentado",
  contrastado: "Contrastado",
  verificado: "Verificado por terceros",
};

export const VALIDATION_HELP: Record<ValidationStatus, string> = {
  declarado: "Informado por el responsable, sin respaldo documental.",
  documentado: "Respaldado por un documento con huella SHA-256.",
  contrastado: "Contrastado con una fuente independiente u oficial.",
  verificado: "Atestado por un tercero distinto del emisor (on-chain).",
};

export const STATUS_LABEL: Record<CommitmentStatus, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  cumplido: "Cumplido",
  vencido: "Vencido",
};

export const fmtDate = (iso: string) => {
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};
