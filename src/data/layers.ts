export const IDESA_WMS = "https://geoportal.salta.gob.ar/geoserver/ows";

/** Capas WMS publicadas por IDESA, verificadas con GetCapabilities/GetMap durante el desarrollo. */
export const WMS_LAYERS = [
  { id: "geonode:poligonos_adaf55f39328ff45c8c60e94eb13a7a0", nombre: "Catastro minero", grupo: "Proyectos e inversiones", defaultOn: true },
  { id: "geonode:red_vial_cc2a06125d06188e13129a57caa71dff", nombre: "Red vial provincial", grupo: "Infraestructura", defaultOn: true },
  { id: "geonode:fc_linea_ribera_03fe6721a69e1846f6ac70b5b62326d7", nombre: "Líneas de ribera y zonas de inundabilidad", grupo: "Recursos hídricos", defaultOn: false },
  { id: "geonode:geo_salta_apn", nombre: "Áreas protegidas nacionales", grupo: "Biodiversidad", defaultOn: false },
  { id: "geonode:unid_veg_cabral_etal_2009", nombre: "Unidades de vegetación", grupo: "Biodiversidad", defaultOn: false },
  { id: "geonode:rfes", nombre: "Establecimientos de salud", grupo: "Infraestructura social", defaultOn: false },
  { id: "geonode:establecimientos_educativos", nombre: "Establecimientos educativos", grupo: "Infraestructura social", defaultOn: false },
] as const;

export const BASEMAPS = {
  osm: {
    nombre: "Mapa (OpenStreetMap)",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satelite: {
    nombre: "Imagen satelital (Esri World Imagery)",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Imágenes &copy; Esri, Maxar, Earthstar Geographics y colaboradores",
  },
} as const;
