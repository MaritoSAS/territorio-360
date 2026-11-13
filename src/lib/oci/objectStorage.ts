import "server-only";
import { createHash } from "node:crypto";

/**
 * Integración con OCI Object Storage mediante una Pre-Authenticated Request (PAR) de bucket.
 * La URL de la PAR es un secreto: solo se lee en el servidor (OCI_OBJECT_STORAGE_PAR_URL).
 * Formato: https://objectstorage.<region>.oraclecloud.com/p/<token>/n/<namespace>/b/<bucket>/o/
 */
export function ociConfig() {
  const raw = process.env.OCI_OBJECT_STORAGE_PAR_URL?.trim();
  if (!raw) return null;
  const parUrl = raw.endsWith("/") ? raw : `${raw}/`;
  const m = parUrl.match(/^https:\/\/objectstorage\.([a-z0-9-]+)\.oraclecloud\.com\/p\/[^/]+\/n\/([^/]+)\/b\/([^/]+)\/o\/$/);
  if (!m) throw new Error("OCI_OBJECT_STORAGE_PAR_URL no tiene el formato de una PAR de bucket (…/n/<ns>/b/<bucket>/o/).");
  return { parUrl, region: m[1], namespace: m[2], bucket: m[3] };
}

export const sha256Hex = (buf: Buffer | Uint8Array) => createHash("sha256").update(buf).digest("hex");

const objectUrl = (parUrl: string, name: string) => parUrl + name.split("/").map(encodeURIComponent).join("/");

export async function putEvidence(name: string, body: Buffer, contentType: string, sha256: string) {
  const cfg = ociConfig();
  if (!cfg) throw new Error("OCI no configurado");
  const res = await fetch(objectUrl(cfg.parUrl, name), {
    method: "PUT",
    headers: { "Content-Type": contentType || "application/octet-stream", "opc-meta-sha256": sha256 },
    body: new Uint8Array(body),
  });
  if (!res.ok) throw new Error(`OCI Object Storage respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return { etag: res.headers.get("etag"), requestId: res.headers.get("opc-request-id"), region: cfg.region, bucket: cfg.bucket };
}

export async function getEvidence(name: string) {
  const cfg = ociConfig();
  if (!cfg) throw new Error("OCI no configurado");
  const res = await fetch(objectUrl(cfg.parUrl, name));
  if (!res.ok) throw new Error(`OCI Object Storage respondió ${res.status} al leer el objeto.`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { sha256: sha256Hex(buf), size: buf.length, metaSha256: res.headers.get("opc-meta-sha256"), requestId: res.headers.get("opc-request-id") };
}
