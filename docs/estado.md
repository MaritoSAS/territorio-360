# Estado de funcionalidades

Leyenda: ✅ operativo y probado · 🟡 implementado, no probado de punta a punta (falta credencial externa) · 🔲 diseñado / pendiente.

| Funcionalidad | Estado | Cómo se verificó / qué falta |
|---|---|---|
| Build, lint y chequeo de tipos | ✅ | `npm run build`, `npm run lint`, `tsc --noEmit` sin errores. |
| Mapa de Salta con departamentos IDESA | ✅ | WFS `geonode:pob2022_deptos` descargado (23 departamentos). |
| Capas WMS IDESA en vivo (7) | ✅ | Catastro minero, red vial, inundabilidad, áreas protegidas, vegetación, salud, educación. Dependen de la disponibilidad del geoportal. |
| Localidades Georef | ✅ | 131 localidades de Salta con centroides. |
| Indicadores derivados por departamento | ✅ | Establecimientos de salud/educativos cada 10.000 hab. (cálculo propio, 0 registros sin asignar). |
| Indicadores del proyecto | ✅ (demo) | Sintéticos, etiquetados SIMULACIÓN. |
| IET 360 | ✅ (experimental) | Promedio simple de progreso hacia metas, ponderación igual. No es un índice oficial. |
| Consultas sobre el grafo | ✅ | Motor determinístico por palabras clave; respeta permisos. No usa IA generativa. |
| Simulador de dos escenarios | ✅ | Estimaciones con supuestos editables. |
| SGI, Participación, Decisiones | ✅ | Estado demo en `localStorage` del navegador. |
| Roles y permisos | ✅ | Selector demo; no hay autenticación real. |
| SHA-256 en navegador y verificación local | ✅ | Probado con `public/demo/informe-tecnico-demostrativo.pdf`; coincide con `sha256sum` (`4f67d497…2647a9`). |
| Contrato `EvidenceRegistry` | ✅ | 4 tests Hardhat en red local. |
| RPC Avalanche Fuji | ✅ | `/api/status` devuelve chainId 43113. |
| Despliegue del contrato en Fuji | 🟡 | Botón en `/estado` y script Hardhat listos. Falta wallet con AVAX de testnet. |
| Registro/atestación on-chain y link a Snowtrace | 🟡 | Probado end-to-end en la UI contra un nodo Hardhat local con chainId 43113 (`scripts/e2e-local-chain.py`): despliegue, alta de verificador, registro confirmado, verificación, atestación, archivo alterado rechazado y duplicado bloqueado. **No probado en Fuji real** (falta AVAX de prueba). La UI no muestra transacciones si no hay contrato. |
| OCI Object Storage | 🟡 | Ruta `/api/oci/evidence` (PUT/GET por PAR, verificación de hash en servidor). Falta `OCI_OBJECT_STORAGE_PAR_URL`. |
| Imagen Docker para OCI Compute | ✅ build local | No desplegada en OCI. |
| Oracle AI Database / Spatial | 🔲 | Esquema en `docs/schema.sql`. |
| OCI Generative AI / Data Science | 🔲 | Pendiente. |
| Autenticación y persistencia en servidor | 🔲 | Pendiente. |
| Copernicus / Sentinel-2 (vegetación) | 🔲 | Indicador sintético con la fuente a integrar declarada. |
