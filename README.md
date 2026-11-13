# TERRITORIO 360 — Territorial Intelligence & Impact Operating System

> La información territorial está dispersa entre gobiernos, empresas, organismos y comunidades. Los datos, compromisos y evidencias no siempre están conectados.
>
> **Territorio 360 integra inteligencia geoespacial, IA, gestión de calidad y blockchain para transformar información en decisiones territoriales verificables.**

MVP para la **Argentina Space Hackathon 2026 — Track Blockchain (Avalanche × Oracle)**. Piloto: Provincia de Salta, aplicado de forma **hipotética** a minería, litio y desarrollo territorial sostenible en la Puna.

> ⚠️ Todos los actores, proyectos, compromisos, cifras y evidencias del caso son **SIMULACIÓN / DATO DEMOSTRATIVO** y están etiquetados así en la interfaz. Los límites departamentales, población (Censo 2022), establecimientos y localidades provienen de fuentes oficiales (IDESA, Georef).

## Módulos

| # | Módulo | Ruta | Qué hace |
|---|---|---|---|
| 01 | Observatorio 360 | `/observatorio` | Mapa Leaflet de Salta: departamentos IDESA con coropleta, 7 capas WMS IDESA en vivo, 131 localidades Georef, proyecto demostrativo y ficha territorial. |
| 02–03 | Inteligencia Territorial + IET 360 | `/diagnostico` | Indicadores ODS 6/8/9/10/15 con fuente, metodología, fecha, confianza y validación; IET 360 experimental; consultas sobre el grafo territorial. |
| 04 | Simulador de Escenarios | `/simulador` | Compara dos alternativas (agua, conectividad, capacitación, proveedores) con supuestos editables: cobertura, costo, ODS, dimensiones, beneficios, riesgos y datos faltantes. |
| 05 | Gestión SGI | `/gestion` | Objetivos, compromisos, responsables, plazos, matriz de riesgos, acciones correctivas e historial. |
| 06 | Participación Territorial | `/participacion` | La comunidad presenta observaciones; el gobierno responde. |
| 07 | Pasaporte de Impacto | `/pasaporte` | Evidencia → SHA-256 en navegador → OCI Object Storage (opcional) → registro en Avalanche Fuji → verificación y atestación. |
| 08 | Centro de Decisiones | `/decisiones` | Alertas por reglas explícitas, brechas, compromisos sin evidencia y decisiones con fundamentos trazables. |
| — | Estado técnico | `/estado` | Estado en vivo de Fuji, contrato, OCI e IDESA; despliegue del contrato con wallet; verificadores; auditoría. |

Roles demo (selector arriba a la derecha): **Gobierno**, **Empresa**, **Comunidad**, **Administrador**. Matriz en `src/lib/roles.ts`. Ningún actor valida su propia evidencia (regla aplicada también en el contrato).

## Ejecutar

Requisitos: Node 20+.

```bash
npm install
cp .env.example .env.local      # opcional: dirección del contrato y PAR de OCI
npm run dev                     # http://localhost:3000
```

Producción: `npm run build && npm start`, o Docker (`docker build -t territorio-360 . && docker run -p 3000:3000 territorio-360`).

Contrato:

```bash
cd contracts && npm install && npx hardhat test
```

Actualizar datos abiertos (IDESA + Georef): `node scripts/fetch-open-data.mjs`.

## Variables de entorno

| Variable | Dónde | Uso |
|---|---|---|
| `NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS` | cliente (pública) | Dirección del `EvidenceRegistry` en Fuji. Si falta, se puede desplegar desde `/estado`. |
| `NEXT_PUBLIC_AVALANCHE_EXPLORER_URL` | cliente | Explorador (default `https://testnet.snowtrace.io`). |
| `OCI_OBJECT_STORAGE_PAR_URL` | **solo servidor** | PAR de lectura/escritura del bucket de evidencias. |
| `DEPLOYER_PRIVATE_KEY` | `contracts/.env`, solo local | Despliegue por Hardhat con una wallet de prueba. Nunca se commitea. |

## Qué funciona y qué no

Ver [`docs/estado.md`](docs/estado.md). Resumen honesto:

- ✅ Probado: app completa (build, lint, tipos), mapa con WMS IDESA en vivo, datos oficiales descargados, IET, simulador, SGI, participación, decisiones, cálculo y verificación SHA-256 en navegador, contrato con 4 tests, conexión al RPC de Fuji.
- ⏳ Implementado sin probar de punta a punta: firma y registro en Fuji con wallet (falta AVAX de prueba / contrato desplegado), subida a OCI Object Storage (falta PAR).
- ❌ No implementado: OCI Generative AI, Oracle AI Database (solo esquema), autenticación real de usuarios, persistencia en servidor (el estado demo vive en `localStorage`).

## Documentación

- [Arquitectura y flujo de evidencia](docs/arquitectura.md)
- [Modelo de datos (SQL)](docs/schema.sql)
- [Avalanche](docs/avalanche.md) · [Oracle Cloud](docs/oci.md)
- [Estado de funcionalidades](docs/estado.md)
- [Guion de demo (3 min)](docs/demo-3min.md) · [Resumen técnico para el jurado](docs/resumen-jurado.md)

## Fuentes de datos

- IDESA — Infraestructura de Datos Espaciales de Salta: https://geoportal.salta.gob.ar/ (capas `pob2022_deptos`, `rfes`, `establecimientos_educativos`, catastro minero, red vial, inundabilidad, áreas protegidas, vegetación).
- API Georef (datos.gob.ar): https://apis.datos.gob.ar/georef/
- © colaboradores de OpenStreetMap; Esri World Imagery.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS 4 · Leaflet/react-leaflet · ethers 6 · Solidity 0.8.24 · Hardhat 2.
