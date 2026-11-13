// Descarga y guarda instantáneas de datos abiertos oficiales usados por el Observatorio.
// Uso: node scripts/fetch-open-data.mjs
import { writeFile } from "node:fs/promises";
import simplify from "@turf/simplify";

const OUT = new URL("../src/data/open/", import.meta.url);
const fetchedAt = new Date().toISOString();

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

const round = (n) => Math.round(n * 1e5) / 1e5;
function roundCoords(c) {
  return typeof c[0] === "number" ? [round(c[0]), round(c[1])] : c.map(roundCoords);
}

const deptosUrl =
  "https://geoportal.salta.gob.ar/geoserver/ows?service=WFS&version=2.0.0&request=GetFeature&typeNames=geonode:pob2022_deptos&outputFormat=application/json&srsName=EPSG:4326";
const deptos = simplify(await getJson(deptosUrl), { tolerance: 0.004, highQuality: true });
deptos.features = deptos.features.map((f) => ({
  type: "Feature",
  properties: {
    nombre: f.properties.nam,
    codigo: f.properties.in1,
    poblacion_2022: f.properties.poblacion,
    superficie_km2: f.properties.sup_en_km2,
    densidad_hab_km2: f.properties.densidad,
  },
  geometry: { type: f.geometry.type, coordinates: roundCoords(f.geometry.coordinates) },
}));
await writeFile(
  new URL("departamentos-salta.json", OUT),
  JSON.stringify({
    meta: {
      fuente: "IDESA – Infraestructura de Datos Espaciales de Salta (capa geonode:pob2022_deptos)",
      dato: "Población por departamento, Censo Nacional 2022 (INDEC), límites IGN",
      url: deptosUrl,
      descargado: fetchedAt,
      procesamiento: "Geometrías simplificadas (turf.simplify, tolerancia 0.004°) para visualización.",
    },
    ...deptos,
  })
);

const locUrl =
  "https://apis.datos.gob.ar/georef/api/localidades?provincia=salta&max=500&campos=id,nombre,categoria,centroide,departamento.nombre,municipio.nombre";
const loc = await getJson(locUrl);
await writeFile(
  new URL("localidades-salta.json", OUT),
  JSON.stringify({
    meta: {
      fuente: "Servicio de Normalización de Datos Geográficos de Argentina (Georef API, datos.gob.ar)",
      url: locUrl,
      descargado: fetchedAt,
      total: loc.total,
    },
    localidades: loc.localidades.map((l) => ({
      id: l.id,
      nombre: l.nombre,
      categoria: l.categoria,
      departamento: l.departamento?.nombre ?? null,
      municipio: l.municipio?.nombre ?? null,
      lat: round(l.centroide.lat),
      lon: round(l.centroide.lon),
    })),
  })
);
console.log(`OK: ${deptos.features.length} departamentos, ${loc.localidades.length} localidades`);

// Indicadores derivados (cálculo propio sobre datos oficiales): establecimientos por departamento.
const norm = (s) =>
  (s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/^GRL\.\s*/, "GENERAL ").trim();
const wfs = (layer) =>
  `https://geoportal.salta.gob.ar/geoserver/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=geonode:${layer}&outputFormat=application/json`;
const salud = await getJson(wfs("rfes"));
const edu = await getJson(wfs("establecimientos_educativos"));
const count = (features, key) => {
  const m = {};
  for (const f of features) {
    const k = norm(f.properties[key]);
    m[k] = (m[k] ?? 0) + 1;
  }
  return m;
};
const saludPorDepto = count(salud.features, "departamen");
const eduPorDepto = count(edu.features, "departamento");
const filas = deptos.features.map((f) => {
  const k = norm(f.properties.nombre);
  const pob = f.properties.poblacion_2022;
  const s = saludPorDepto[k] ?? 0;
  const e = eduPorDepto[k] ?? 0;
  return {
    departamento: f.properties.nombre,
    poblacion_2022: pob,
    densidad_hab_km2: f.properties.densidad_hab_km2,
    establecimientos_salud: s,
    salud_cada_10k_hab: Math.round((s / pob) * 1e5) / 10,
    establecimientos_educativos: e,
    educativos_cada_10k_hab: Math.round((e / pob) * 1e5) / 10,
  };
});
const sinAsignar = {
  salud: salud.features.length - filas.reduce((a, r) => a + r.establecimientos_salud, 0),
  educativos: edu.features.length - filas.reduce((a, r) => a + r.establecimientos_educativos, 0),
};
await writeFile(
  new URL("indicadores-departamentales.json", OUT),
  JSON.stringify(
    {
      meta: {
        fuentes: [
          { capa: "geonode:rfes", titulo: "Establecimientos de salud (IDESA)", url: wfs("rfes"), registros: salud.features.length },
          {
            capa: "geonode:establecimientos_educativos",
            titulo: "Establecimientos educativos (IDESA)",
            url: wfs("establecimientos_educativos"),
            registros: edu.features.length,
          },
          { capa: "geonode:pob2022_deptos", titulo: "Población por departamento, Censo 2022 (IDESA)", url: deptosUrl },
        ],
        metodologia:
          "Conteo de registros por atributo de departamento de cada capa, dividido por la población del Censo 2022 y multiplicado por 10.000. Cuenta registros (no capacidad, complejidad ni calidad del servicio).",
        sin_asignar: sinAsignar,
        descargado: fetchedAt,
      },
      filas,
    },
    null,
    1
  )
);
console.log("Indicadores departamentales:", filas.length, "sin asignar:", sinAsignar);
