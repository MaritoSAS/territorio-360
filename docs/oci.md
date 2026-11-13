# Oracle Cloud Infrastructure

| Servicio | Rol en Territorio 360 | Estado en el MVP |
|---|---|---|
| **Object Storage** | Guarda los documentos de evidencia (off-chain). El hash se ancla en Avalanche. | **Implementado, sin probar contra OCI** (faltan credenciales). |
| **Compute / Container Instances** | Hospeda la app Next.js (Dockerfile incluido, `output: standalone`). | Imagen Docker construible; no desplegada. |
| **AI Database 23ai + Spatial** | Base relacional + geometrías de territorios, consultas espaciales y vectoriales. | Esquema en `docs/schema.sql`; el MVP usa JSON versionado. |
| **Generative AI** | Redactar resúmenes sobre el grafo, siempre citando registros. | Pendiente. El MVP usa un motor determinístico (`src/lib/graph.ts`) y lo declara. |
| **Data Science** | Calibrar el IET 360 y modelos de escenarios con datos reales. | Pendiente. |

## Object Storage vía Pre-Authenticated Request

Se eligió una PAR porque es una sola URL, revocable y con vencimiento, y no requiere el SDK ni claves API en la app.

1. OCI Console → Storage → Buckets → crear bucket **privado** (ej. `t360-evidencias`).
2. Bucket → *Pre-Authenticated Requests* → *Create*: tipo **Bucket**, acceso **Permit object reads and writes**, con fecha de vencimiento.
3. Copiar la URL (`https://objectstorage.<region>.oraclecloud.com/p/<token>/n/<namespace>/b/<bucket>/o/`).
4. Definirla **solo en el servidor**: `OCI_OBJECT_STORAGE_PAR_URL=...` (`.env.local` o `docker run -e`).

Implementación: [`src/lib/oci/objectStorage.ts`](../src/lib/oci/objectStorage.ts) (`server-only`) y [`src/app/api/oci/evidence/route.ts`](../src/app/api/oci/evidence/route.ts).

- `POST /api/oci/evidence` (multipart: `file`, `commitmentId`, `sha256`): límite 10 MB, recalcula SHA-256 en servidor, rechaza (422) si no coincide con el del navegador, sube con `PUT` y metadato `opc-meta-sha256`. Nombre: `evidencias/<CMP>/<sha256>-<archivo>`.
- `GET /api/oci/evidence?name=...`: relee el objeto y recalcula el hash (verificación de integridad del almacenamiento).
- `GET /api/status`: informa región y bucket configurados (nunca el token).

## Despliegue en OCI Compute

```bash
docker build -t territorio-360 --build-arg NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS=0x... .
docker run -d -p 80:3000 -e OCI_OBJECT_STORAGE_PAR_URL='https://objectstorage...' territorio-360
```

Abrir el puerto 80/443 en la Security List de la VCN.
