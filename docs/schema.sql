-- TERRITORIO 360 — Modelo de datos (PostgreSQL / Oracle AI Database 23ai compatible con ajustes menores).
-- El MVP sirve estos datos desde JSON versionado (src/data). Este esquema es el destino para producción.
-- Convención: demo = TRUE marca registros SIMULACIÓN / DATO DEMOSTRATIVO.

CREATE TABLE territories (
  id            VARCHAR(40) PRIMARY KEY,
  nombre        VARCHAR(200) NOT NULL,
  tipo          VARCHAR(20)  NOT NULL CHECK (tipo IN ('provincia','departamento','localidad','area')),
  parent_id     VARCHAR(40)  REFERENCES territories(id),
  codigo_oficial VARCHAR(20),               -- código INDEC / Georef
  geom          GEOMETRY,                   -- Oracle: SDO_GEOMETRY (SRID 4326)
  fuente        VARCHAR(300) NOT NULL
);

CREATE TABLE actors (
  id     VARCHAR(40) PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  tipo   VARCHAR(20)  NOT NULL CHECK (tipo IN ('gobierno','empresa','comunidad','organismo','verificador')),
  wallet_address CHAR(42),                   -- dirección EVM pública para firmar/atestar
  demo   BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE users (
  id        VARCHAR(40) PRIMARY KEY,
  actor_id  VARCHAR(40) NOT NULL REFERENCES actors(id),
  email     VARCHAR(200) UNIQUE NOT NULL,
  rol       VARCHAR(20) NOT NULL CHECK (rol IN ('gobierno','empresa','comunidad','admin')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
  id           VARCHAR(40) PRIMARY KEY,
  nombre       VARCHAR(200) NOT NULL,
  sector       VARCHAR(60)  NOT NULL,
  titular_actor_id VARCHAR(40) NOT NULL REFERENCES actors(id),
  territorio_id VARCHAR(40) NOT NULL REFERENCES territories(id),
  radio_influencia_km NUMERIC(8,2),
  estado       VARCHAR(30) NOT NULL,
  demo         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE indicators (
  id            VARCHAR(40) PRIMARY KEY,
  nombre        VARCHAR(200) NOT NULL,
  definicion    TEXT NOT NULL,
  unidad        VARCHAR(60) NOT NULL,
  dimension     VARCHAR(20) NOT NULL CHECK (dimension IN ('ambiental','social','economica','institucional','gestion')),
  ods           VARCHAR(40) NOT NULL,          -- ej. '6,8'
  metodologia   TEXT NOT NULL,
  fuente        VARCHAR(300) NOT NULL,
  fuente_url    VARCHAR(500),
  linea_base    NUMERIC,
  meta          NUMERIC,
  confianza     VARCHAR(10) NOT NULL CHECK (confianza IN ('alta','media','baja')),
  limitaciones  TEXT,
  demo          BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE commitments (
  id           VARCHAR(40) PRIMARY KEY,
  project_id   VARCHAR(40) NOT NULL REFERENCES projects(id),
  titulo       VARCHAR(300) NOT NULL,
  descripcion  TEXT,
  responsable_actor_id VARCHAR(40) NOT NULL REFERENCES actors(id),
  responsable_cargo VARCHAR(120),
  fecha_alta   DATE NOT NULL,
  fecha_limite DATE NOT NULL,
  estado       VARCHAR(20) NOT NULL CHECK (estado IN ('pendiente','en_curso','cumplido','vencido')),
  avance_declarado NUMERIC(5,2) CHECK (avance_declarado BETWEEN 0 AND 100),
  referencias_iso VARCHAR(200),                -- orientativas, no implican certificación
  demo         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE commitment_indicators (
  commitment_id VARCHAR(40) REFERENCES commitments(id),
  indicator_id  VARCHAR(40) REFERENCES indicators(id),
  PRIMARY KEY (commitment_id, indicator_id)
);

CREATE TABLE commitment_territories (
  commitment_id VARCHAR(40) REFERENCES commitments(id),
  territory_id  VARCHAR(40) REFERENCES territories(id),
  PRIMARY KEY (commitment_id, territory_id)
);

CREATE TABLE evidences (
  id            VARCHAR(40) PRIMARY KEY,
  project_id    VARCHAR(40) NOT NULL REFERENCES projects(id),
  commitment_id VARCHAR(40) NOT NULL REFERENCES commitments(id),
  actor_id      VARCHAR(40) NOT NULL REFERENCES actors(id),
  titulo        VARCHAR(300) NOT NULL,
  fecha         DATE NOT NULL,
  object_storage_ref VARCHAR(500),            -- nombre del objeto en OCI; nunca on-chain
  sha256        CHAR(64),
  validacion    VARCHAR(20) NOT NULL CHECK (validacion IN ('declarado','documentado','contrastado','verificado')),
  demo          BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (sha256)
);

CREATE TABLE measurements (
  id           VARCHAR(40) PRIMARY KEY,
  indicator_id VARCHAR(40) NOT NULL REFERENCES indicators(id),
  territory_id VARCHAR(40) REFERENCES territories(id),
  fecha        DATE NOT NULL,
  valor        NUMERIC NOT NULL,
  fuente       VARCHAR(300) NOT NULL,
  validacion   VARCHAR(20) NOT NULL,
  evidence_id  VARCHAR(40) REFERENCES evidences(id),
  demo         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE risks (
  id           VARCHAR(40) PRIMARY KEY,
  titulo       VARCHAR(300) NOT NULL,
  descripcion  TEXT,
  categoria    VARCHAR(20) NOT NULL,
  probabilidad SMALLINT NOT NULL CHECK (probabilidad BETWEEN 1 AND 5),
  impacto      SMALLINT NOT NULL CHECK (impacto BETWEEN 1 AND 5),
  project_id   VARCHAR(40) REFERENCES projects(id),
  commitment_id VARCHAR(40) REFERENCES commitments(id),
  tratamiento  TEXT,
  responsable_actor_id VARCHAR(40) REFERENCES actors(id),
  estado       VARCHAR(20) NOT NULL CHECK (estado IN ('abierto','en_tratamiento','cerrado')),
  demo         BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE corrective_actions (
  id          VARCHAR(40) PRIMARY KEY,
  origen_tipo VARCHAR(20) NOT NULL CHECK (origen_tipo IN ('riesgo','compromiso')),
  origen_id   VARCHAR(40) NOT NULL,
  descripcion TEXT NOT NULL,
  responsable_actor_id VARCHAR(40) REFERENCES actors(id),
  fecha_limite DATE,
  estado      VARCHAR(20) NOT NULL,
  demo        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE scenarios (
  id          VARCHAR(40) PRIMARY KEY,
  nombre      VARCHAR(200) NOT NULL,
  supuestos   JSON NOT NULL,                  -- costos unitarios, tasas, localidades, presupuesto
  resultado   JSON NOT NULL,                  -- ESTIMACIÓN, no impacto comprobado
  created_by  VARCHAR(40) REFERENCES users(id),
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE decisions (
  id          VARCHAR(40) PRIMARY KEY,
  titulo      VARCHAR(300) NOT NULL,
  fecha       DATE NOT NULL,
  actor_id    VARCHAR(40) NOT NULL REFERENCES actors(id),
  descripcion TEXT,
  estado      VARCHAR(20) NOT NULL CHECK (estado IN ('propuesta','aprobada','en_revision')),
  demo        BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE decision_grounds (              -- fundamentos trazables
  decision_id VARCHAR(40) REFERENCES decisions(id),
  tipo        VARCHAR(20) NOT NULL CHECK (tipo IN ('indicador','evidencia','riesgo','escenario','compromiso')),
  ref_id      VARCHAR(40) NOT NULL,
  PRIMARY KEY (decision_id, tipo, ref_id)
);

CREATE TABLE observations (
  id            VARCHAR(40) PRIMARY KEY,
  fecha         DATE NOT NULL,
  actor_id      VARCHAR(40) NOT NULL REFERENCES actors(id),
  commitment_id VARCHAR(40) REFERENCES commitments(id),
  territory_id  VARCHAR(40) REFERENCES territories(id),
  texto         VARCHAR(600) NOT NULL,
  estado        VARCHAR(20) NOT NULL CHECK (estado IN ('recibida','respondida')),
  respuesta     TEXT,
  respondida_por VARCHAR(40) REFERENCES actors(id)
);

CREATE TABLE blockchain_transactions (
  tx_hash      CHAR(66) PRIMARY KEY,
  chain_id     INTEGER NOT NULL,               -- 43113 = Avalanche Fuji
  contract     CHAR(42) NOT NULL,
  tipo         VARCHAR(20) NOT NULL CHECK (tipo IN ('register','attest','deploy','set_verifier')),
  evidence_id  VARCHAR(40) REFERENCES evidences(id),
  from_address CHAR(42) NOT NULL,
  estado       VARCHAR(20) NOT NULL CHECK (estado IN ('pending','confirmed','failed')),
  block_number BIGINT,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_events (
  id         VARCHAR(60) PRIMARY KEY,
  fecha      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id    VARCHAR(40) REFERENCES users(id),
  rol        VARCHAR(20) NOT NULL,
  accion     VARCHAR(200) NOT NULL,
  entidad    VARCHAR(40) NOT NULL,
  entidad_id VARCHAR(80) NOT NULL,
  detalle    TEXT
);
-- Regla de gobernanza (aplicación + contrato): un actor no puede atestar evidencia que él mismo presentó.
