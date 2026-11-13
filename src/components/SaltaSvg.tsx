import deptos from "@/data/open/departamentos-salta.json";

type Ring = number[][];
const W = 420;
const H = 460;
const bbox = { minX: -68.6, maxX: -62.3, minY: -26.45, maxY: -21.95 };
const kx = W / (bbox.maxX - bbox.minX);
const ky = H / (bbox.maxY - bbox.minY);
const k = Math.min(kx, ky);
const px = (lon: number) => (lon - bbox.minX) * k;
const py = (lat: number) => (bbox.maxY - lat) * k;

function ringsOf(g: { type: string; coordinates: unknown }): Ring[] {
  if (g.type === "Polygon") return g.coordinates as Ring[];
  if (g.type === "MultiPolygon") return (g.coordinates as Ring[][]).flat();
  return [];
}

/** Silueta de Salta a partir de los límites departamentales reales (IDESA). */
export function SaltaSvg({ highlight = "Los Andes" }: { highlight?: string }) {
  return (
    <svg viewBox={`0 0 ${(bbox.maxX - bbox.minX) * k} ${(bbox.maxY - bbox.minY) * k}`} className="h-full w-full" role="img" aria-label="Departamentos de Salta">
      {deptos.features.map((f) => {
        const d = ringsOf(f.geometry)
          .map((r) => "M" + r.map(([x, y]) => `${px(x).toFixed(1)},${py(y).toFixed(1)}`).join("L") + "Z")
          .join("");
        const hl = f.properties.nombre === highlight;
        return (
          <path key={f.properties.codigo} d={d} fill={hl ? "#1fae8d" : "#13315c"} fillOpacity={hl ? 0.85 : 0.55} stroke="#7dd3c0" strokeWidth={0.8}>
            <title>{f.properties.nombre}</title>
          </path>
        );
      })}
    </svg>
  );
}
