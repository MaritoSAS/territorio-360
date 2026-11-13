# Resumen técnico para el jurado

**Territorio 360** es un sistema operativo de inteligencia territorial e impacto: conecta datos geoespaciales oficiales, indicadores ODS, compromisos de gestión, riesgos, participación comunitaria y decisiones, y ancla la evidencia en **Avalanche** para que cualquier actor pueda verificarla.

**Piloto:** Salta, Puna (departamento Los Andes), caso hipotético de minería de litio. Los datos territoriales son oficiales; el proyecto y sus cifras son ficticios y están etiquetados.

## Qué es real
- **Datos geoespaciales oficiales:** 23 departamentos y población del Censo 2022 (IDESA WFS), 131 localidades (API Georef), 7 capas WMS de IDESA en vivo, indicadores derivados con metodología publicada.
- **Contrato `EvidenceRegistry`** (Solidity 0.8.24) con 4 tests: registro de SHA-256 por proyecto/compromiso, emisor, bloque y evento; atestación por verificadores independientes, con prohibición de autoatestación y de duplicados.
- **Flujo de evidencia** en el navegador: SHA-256 con Web Crypto, firma con MetaMask/Core en Fuji (chainId 43113), estado de la tx, link a Snowtrace, verificación posterior del archivo contra la huella on-chain.
- **OCI Object Storage** del lado servidor vía PAR, con doble verificación del hash (navegador y servidor) y metadato `opc-meta-sha256`. La credencial nunca llega al cliente.
- **Dockerfile** para OCI Compute.

## Qué es experimental o pendiente
- **IET 360:** índice complementario a los ODS; promedio simple con ponderación igual, declarado como prototipo.
- **Consultas al grafo:** motor determinístico que responde solo con registros existentes. OCI Generative AI queda en la hoja de ruta.
- **Pendiente de credenciales:** despliegue en Fuji y prueba de OCI Object Storage. Sin ellas, la interfaz no muestra resultados simulados.
- **Oracle AI Database/Spatial:** esquema de 13+ tablas en `docs/schema.sql`, todavía no conectado.

## Por qué blockchain
No para guardar documentos, sino para que **ningún actor pueda modificar en silencio la evidencia de un compromiso** ni validar su propio impacto. On-chain solo va la huella, IDs hasheados y atestaciones; los documentos y datos personales quedan off-chain (OCI).

## Por qué Oracle
Object Storage custodia los documentos; AI Database + Spatial es el destino natural del grafo territorial (geometrías, relaciones, búsqueda vectorial); Generative AI y Data Science se suman para resumir y calibrar escenarios con datos reales.

## Gobernanza
Cuatro roles con permisos diferenciados (Gobierno, Empresa, Comunidad, Administrador). Cuatro niveles de evidencia: Declarado → Documentado → Contrastado → Verificado por terceros. Las referencias ISO/GRI son orientativas: **no se afirma certificación ni conformidad**.
