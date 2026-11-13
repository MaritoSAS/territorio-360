import { NextResponse } from "next/server";
import { getEvidence, ociConfig, putEvidence, sha256Hex } from "@/lib/oci/objectStorage";

export const runtime = "nodejs";
const MAX_BYTES = 10 * 1024 * 1024;
const safe = (s: string) => s.normalize("NFD").replace(/[^\w.-]+/g, "_").slice(0, 80);

function notConfigured() {
  return NextResponse.json(
    { error: "OCI Object Storage no está configurado en este despliegue (falta OCI_OBJECT_STORAGE_PAR_URL)." },
    { status: 503 }
  );
}

export async function POST(req: Request) {
  try {
    if (!ociConfig()) return notConfigured();
    const form = await req.formData();
    const file = form.get("file");
    const commitmentId = String(form.get("commitmentId") ?? "");
    const clientSha = String(form.get("sha256") ?? "").toLowerCase();
    if (!(file instanceof File)) return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
    if (!/^CMP-\d{2}$/.test(commitmentId)) return NextResponse.json({ error: "Compromiso inválido." }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "El archivo supera 10 MB." }, { status: 413 });

    const buf = Buffer.from(await file.arrayBuffer());
    const serverSha = sha256Hex(buf);
    if (clientSha && clientSha !== serverSha)
      return NextResponse.json({ error: "La huella calculada en el servidor no coincide con la del navegador." }, { status: 422 });

    const name = `evidencias/${commitmentId}/${serverSha}-${safe(file.name)}`;
    const r = await putEvidence(name, buf, file.type, serverSha);
    return NextResponse.json({ objectName: name, sha256: serverSha, ...r });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}

/** Relee el objeto desde OCI y recalcula su SHA-256 en el servidor. */
export async function GET(req: Request) {
  try {
    if (!ociConfig()) return notConfigured();
    const name = new URL(req.url).searchParams.get("name") ?? "";
    if (!/^evidencias\/CMP-\d{2}\/[a-f0-9]{64}-[\w.-]+$/.test(name)) return NextResponse.json({ error: "Nombre de objeto inválido." }, { status: 400 });
    return NextResponse.json({ objectName: name, ...(await getEvidence(name)) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
