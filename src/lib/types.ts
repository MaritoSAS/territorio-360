export type Role = "gobierno" | "empresa" | "comunidad" | "admin";

/** Escala de confianza de la información (de menor a mayor). */
export type ValidationStatus = "declarado" | "documentado" | "contrastado" | "verificado";

export type Confidence = "alta" | "media" | "baja";

export type Dimension = "ambiental" | "social" | "economica" | "institucional" | "gestion";

export interface Territory {
  id: string;
  nombre: string;
  tipo: "provincia" | "departamento" | "localidad" | "area_influencia";
  departamento?: string;
  /** true si el territorio es parte del caso hipotético. */
  demo: boolean;
  fuente: string;
}

export interface Actor {
  id: string;
  nombre: string;
  tipo: "gobierno" | "empresa" | "comunidad" | "tercero";
  descripcion: string;
  demo: true;
}

export interface Project {
  id: string;
  nombre: string;
  descripcion: string;
  sector: string;
  estado: "planificado" | "en_ejecucion" | "finalizado";
  territorioIds: string[];
  actorIds: string[];
  inicio: string;
  fin: string;
  ubicacion: { lat: number; lon: number; descripcion: string };
  demo: true;
}

export interface Indicator {
  id: string;
  nombre: string;
  definicion: string;
  dimension: Dimension;
  ods: number[];
  unidad: string;
  direccion: "mayor_mejor" | "menor_mejor";
  lineaBase: number | null;
  meta: number | null;
  valorObservado: number | null;
  fuente: string;
  fuenteUrl?: string;
  fecha: string;
  cobertura: string;
  metodologia: string;
  confianza: Confidence;
  validacion: ValidationStatus;
  /** true = cifra sintética (SIMULACIÓN / DATO DEMOSTRATIVO). */
  demo: boolean;
  limitaciones?: string;
}

export interface Measurement {
  id: string;
  indicatorId: string;
  fecha: string;
  valor: number;
  fuente: string;
  validacion: ValidationStatus;
  evidenceId?: string;
  demo: boolean;
}

export type CommitmentStatus = "pendiente" | "en_curso" | "cumplido" | "vencido";

export interface SgiObjective {
  id: string;
  titulo: string;
  norma: string;
  descripcion: string;
}

export interface Commitment {
  id: string;
  projectId: string;
  objetivoId: string;
  titulo: string;
  descripcion: string;
  responsableActorId: string;
  responsableCargo: string;
  fechaAlta: string;
  fechaLimite: string;
  estado: CommitmentStatus;
  avance: number;
  ods: number[];
  indicatorIds: string[];
  territorioIds: string[];
  referenciasIso: string[];
  demo: true;
}

export interface Evidence {
  id: string;
  projectId: string;
  commitmentId: string;
  actorId: string;
  fecha: string;
  titulo: string;
  ubicacion?: string;
  archivoRef: string | null;
  sha256: string | null;
  validacion: ValidationStatus;
  txHash?: string | null;
  demo: true;
}

export interface Risk {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: "ambiental" | "social" | "operativo" | "compliance" | "seguridad";
  probabilidad: 1 | 2 | 3 | 4 | 5;
  impacto: 1 | 2 | 3 | 4 | 5;
  projectIds: string[];
  territorioIds: string[];
  commitmentIds: string[];
  tratamiento: string;
  responsableActorId: string;
  estado: "abierto" | "en_tratamiento" | "cerrado";
  referenciasIso: string[];
  demo: true;
}

export interface CorrectiveAction {
  id: string;
  origen: { tipo: "riesgo" | "compromiso"; id: string };
  descripcion: string;
  responsableActorId: string;
  fechaLimite: string;
  estado: "abierta" | "en_curso" | "cerrada";
  demo: true;
}

export interface Decision {
  id: string;
  titulo: string;
  fecha: string;
  actorId: string;
  descripcion: string;
  fundamentos: { tipo: "indicador" | "evidencia" | "riesgo" | "escenario" | "compromiso"; id: string }[];
  estado: "propuesta" | "aprobada" | "en_revision";
  demo: true;
}

export interface Observation {
  id: string;
  fecha: string;
  actorId: string;
  commitmentId?: string;
  territorioId?: string;
  texto: string;
  estado: "recibida" | "respondida";
  respuesta?: string;
  demo: boolean;
}

export interface AuditEvent {
  id: string;
  fecha: string;
  actor: string;
  rol: Role | "sistema";
  accion: string;
  entidad: string;
  entidadId: string;
  detalle?: string;
}
