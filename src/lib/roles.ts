import type { Role } from "@/lib/types";

export const ROLES: { id: Role; nombre: string; actorId: string; permisos: string[] }[] = [
  {
    id: "gobierno",
    nombre: "Gobierno",
    actorId: "ACT-GOB",
    permisos: ["Consulta territorial", "Planificación", "Seguimiento de proyectos", "Gestión de indicadores y políticas", "Atestar evidencias de terceros"],
  },
  {
    id: "empresa",
    nombre: "Empresa",
    actorId: "ACT-EMP",
    permisos: ["Registro de proyectos", "Gestión de compromisos", "Presentación de evidencias", "Seguimiento de riesgos y acciones"],
  },
  {
    id: "comunidad",
    nombre: "Comunidad",
    actorId: "ACT-COM",
    permisos: ["Consulta de información pública", "Presentación de observaciones", "Registro de aportes", "Seguimiento de respuestas"],
  },
  {
    id: "admin",
    nombre: "Administrador",
    actorId: "ACT-GOB",
    permisos: ["Gestión de usuarios", "Configuración", "Fuentes de datos", "Auditoría", "Despliegue del contrato"],
  },
];

export type Permission =
  | "evidence:submit"
  | "evidence:attest"
  | "observation:create"
  | "observation:respond"
  | "risk:view_detail"
  | "audit:view"
  | "contract:deploy"
  | "decision:create";

const MATRIX: Record<Role, Permission[]> = {
  gobierno: ["evidence:attest", "observation:respond", "risk:view_detail", "decision:create", "audit:view"],
  empresa: ["evidence:submit", "risk:view_detail"],
  comunidad: ["observation:create"],
  admin: ["audit:view", "contract:deploy", "risk:view_detail"],
};

export const can = (role: Role, p: Permission) => MATRIX[role].includes(p);
export const roleInfo = (role: Role) => ROLES.find((r) => r.id === role)!;
