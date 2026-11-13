import { NextResponse } from "next/server";
import { ociConfig } from "@/lib/oci/objectStorage";
import { ENV_CONTRACT_ADDRESS, FUJI } from "@/lib/blockchain/config";

export const dynamic = "force-dynamic";

async function timed<T>(fn: () => Promise<T>, ms = 6000): Promise<T | null> {
  return Promise.race([fn(), new Promise<null>((r) => setTimeout(() => r(null), ms))]).catch(() => null);
}

export async function GET() {
  let oci: { configured: boolean; region?: string; bucket?: string; error?: string } = { configured: false };
  try {
    const c = ociConfig();
    if (c) oci = { configured: true, region: c.region, bucket: c.bucket };
  } catch (e) {
    oci = { configured: false, error: (e as Error).message };
  }

  const [chainId, idesa] = await Promise.all([
    timed(async () => {
      const r = await fetch(FUJI.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_chainId", params: [] }),
        cache: "no-store",
      });
      return parseInt((await r.json()).result, 16);
    }),
    timed(async () => (await fetch("https://geoportal.salta.gob.ar/geoserver/ows?service=WMS&request=GetCapabilities", { method: "HEAD", cache: "no-store" })).ok),
  ]);

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    oci,
    avalanche: { rpcReachable: chainId === FUJI.chainId, chainId, contractFromEnv: ENV_CONTRACT_ADDRESS || null },
    idesa: { reachable: !!idesa },
    ai: { provider: "OCI Generative AI", configured: false, note: "No integrado en el MVP: las consultas usan un motor determinístico." },
  });
}
