# Guion de demo — 3 minutos

**0:00 – 0:20 · Problema**
«En Salta, la información territorial está dispersa: el gobierno tiene capas geográficas, la empresa sus reportes, la comunidad sus reclamos. Nadie puede verificar si un compromiso se cumplió. Territorio 360 conecta territorio, compromisos y evidencias, y deja una huella verificable en Avalanche.»
Mostrar la home: cinco capas y flujo Registro → Hash → Avalanche → Verificación. Señalar la etiqueta SIMULACIÓN / DATO DEMOSTRATIVO.

**0:20 – 0:55 · Observatorio** (`/observatorio`)
Departamentos y población del Censo 2022 (IDESA), coropleta de establecimientos de salud. Activar el catastro minero y la red vial: son WMS del geoportal de Salta, en vivo. Clic en Los Andes: ficha oficial (7.182 hab., 0,3 hab/km²) y, abajo, el grafo del proyecto hipotético con compromisos y riesgos.

**0:55 – 1:25 · Diagnóstico** (`/diagnostico`)
Filtrar ODS 6. Abrir una ficha metodológica: fuente, fecha, confianza y estado de validación. Mostrar el IET 360 como prototipo experimental, con sus supuestos a la vista. Consulta: «¿Qué proyectos presentan compromisos vencidos?» → respuesta con fuentes y limitaciones, sin IA generativa.

**1:25 – 1:50 · Simulador** (`/simulador`)
A «Agua primero» vs. B «Economía local»: cobertura, costo estimado, ODS, riesgos y datos faltantes. «Son estimaciones con supuestos editables, no impactos comprobados.»

**1:50 – 2:40 · Pasaporte de Impacto** (`/pasaporte`, rol Empresa)
CMP-01 → «Usar informe demostrativo» → SHA-256 calculado en el navegador. Explicar que el documento no va a la blockchain. «Firmar y registrar en Fuji» → MetaMask → tx pendiente → confirmada con bloque → link a Snowtrace.
Cambiar a rol Gobierno → «Verificar evidencia» con el mismo archivo → «Huella registrada on-chain», emisor y bloque. Modificar un byte del archivo → «No registrada». Atestar como contrastada: un tercero distinto del emisor.
*(Si no hay contrato desplegado, la pantalla lo dice: no se muestra ninguna transacción simulada.)*

**2:40 – 3:00 · Cierre**
Centro de Decisiones: alertas (CMP-02 vencido, riesgo de agua) y decisiones con fundamentos trazables. «Oracle aporta la capa de datos y documentos —Object Storage hoy, AI Database y Generative AI en la hoja de ruta—; Avalanche aporta la confianza. Territorio 360 convierte información dispersa en decisiones verificables.»

### Preparación
- Wallet con AVAX de Fuji y contrato desplegado (`/estado`, rol Administrador).
- Para atestar: habilitar como verificador una segunda cuenta en `/estado` y usarla con el rol Gobierno.
- «Reiniciar demo» en `/estado` antes de presentar.
