"use client";

import "leaflet/dist/leaflet.css";
import { Circle, CircleMarker, GeoJSON, MapContainer, Marker, Popup, TileLayer, Tooltip, WMSTileLayer } from "react-leaflet";
import L from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import deptos from "@/data/open/departamentos-salta.json";
import localidades from "@/data/open/localidades-salta.json";
import indicadores from "@/data/open/indicadores-departamentales.json";
import { colorFor, quantileBreaks, type ChoroplethKey } from "./choropleth";

const byDepto = Object.fromEntries(indicadores.filas.map((f) => [f.departamento, f]));
import { projects } from "@/data/demo";
import { BASEMAPS, IDESA_WMS, WMS_LAYERS } from "@/data/layers";

const projectIcon = L.divIcon({
  className: "",
  html: '<div style="width:22px;height:22px;border-radius:6px;background:#1fae8d;border:3px solid #fff;box-shadow:0 0 0 2px #0b2545"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function MapView({
  basemap,
  activeWms,
  choropleth,
  showLocalidades,
  showProject,
  selectedDepto,
  onSelectDepto,
  onSelectLocalidad,
}: {
  basemap: keyof typeof BASEMAPS;
  activeWms: string[];
  choropleth: ChoroplethKey;
  showLocalidades: boolean;
  showProject: boolean;
  selectedDepto: string | null;
  onSelectDepto: (n: string) => void;
  onSelectLocalidad: (id: string) => void;
}) {
  const breaks = choropleth !== "none" ? quantileBreaks(choropleth) : [];
  const style = (f?: Feature<Geometry, { nombre: string }>) => {
    const n = f?.properties.nombre ?? "";
    const sel = n === selectedDepto;
    const fill = choropleth !== "none" ? colorFor(byDepto[n]?.[choropleth] as number, breaks) : "#13315c";
    return { color: sel ? "#1fae8d" : "#0b2545", weight: sel ? 3 : 1, fillColor: fill, fillOpacity: choropleth !== "none" ? 0.55 : 0.05 };
  };
  const p = projects[0];
  const bm = BASEMAPS[basemap];

  return (
    <MapContainer bounds={[[-26.45, -68.6], [-21.95, -62.3]]} minZoom={5} className="h-full w-full" scrollWheelZoom>
      <TileLayer key={basemap} url={bm.url} attribution={bm.attribution} maxZoom={18} />
      {WMS_LAYERS.filter((l) => activeWms.includes(l.id)).map((l) => (
        <WMSTileLayer
          key={l.id}
          url={IDESA_WMS}
          params={{ layers: l.id, format: "image/png", transparent: true, version: "1.1.1" }}
          attribution='Capas WMS: <a href="https://geoportal.salta.gob.ar/">IDESA</a>'
          opacity={0.85}
        />
      ))}
      <GeoJSON
        key={`${choropleth}-${selectedDepto}`}
        data={deptos as unknown as FeatureCollection}
        style={style as L.StyleFunction}
        onEachFeature={(f, layer) => {
          layer.on("click", () => onSelectDepto(f.properties.nombre));
          layer.bindTooltip(f.properties.nombre, { sticky: true, direction: "top" });
        }}
      />
      {showLocalidades &&
        localidades.localidades.map((l) => (
          <CircleMarker
            key={l.id}
            center={[l.lat, l.lon]}
            radius={4}
            pathOptions={{ color: "#fff", weight: 1, fillColor: "#0f766e", fillOpacity: 1 }}
            eventHandlers={{ click: () => onSelectLocalidad(l.id) }}
          >
            <Tooltip direction="top">{l.nombre}</Tooltip>
          </CircleMarker>
        ))}
      {showProject && (
        <>
          <Circle center={[p.ubicacion.lat, p.ubicacion.lon]} radius={45000} pathOptions={{ color: "#1fae8d", dashArray: "6 6", fillOpacity: 0.08 }} />
          <Marker position={[p.ubicacion.lat, p.ubicacion.lon]} icon={projectIcon}>
            <Popup>
              <b>{p.nombre}</b>
              <br />
              <span style={{ color: "#b45309", fontWeight: 700, fontSize: 11 }}>SIMULACIÓN / DATO DEMOSTRATIVO</span>
              <br />
              {p.ubicacion.descripcion}. Radio de influencia ilustrativo: 45 km.
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
