"use client";

import { useCallback, useEffect, useState } from "react";
import { Mono, Notice, PageHeader, StatusPill } from "@/components/ui";
import { addressUrl, ENV_CONTRACT_ADDRESS, FUJI, txUrl } from "@/lib/blockchain/config";
import { connectWallet, deployRegistry, hasWallet, humanError, isVerifier, readContractInfo, setVerifierTx } from "@/lib/blockchain/registry";
import { useContractAddress } from "@/lib/blockchain/useContractAddress";
import { can } from "@/lib/roles";
import { useStore } from "@/lib/store";
import { isAddress } from "ethers";

interface Status {
  checkedAt: string;
  oci: { configured: boolean; region?: string; bucket?: string; error?: string };
  avalanche: { rpcReachable: boolean; chainId: number | null; contractFromEnv: string | null };
  idesa: { reachable: boolean };
  ai: { provider: string; configured: boolean; note: string };
}

function Row({ name, tone, state, children }: { name: string; tone: "ok" | "warn" | "bad" | "neutral"; state: string; children?: React.ReactNode }) {
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="py-2 pr-3 font-medium">{name}</td>
      <td className="py-2 pr-3">
        <StatusPill tone={tone}>{state}</StatusPill>
      </td>
      <td className="py-2 text-xs text-slate-600">{children}</td>
    </tr>
  );
}

export default function Estado() {
  const { role, contractOverride, setContractOverride, log, resetDemo, audit } = useStore();
  const { address: contract } = useContractAddress();
  const [st, setSt] = useState<Status | null>(null);
  const [info, setInfo] = useState<{ owner: string; evidenceCount: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deployTx, setDeployTx] = useState<string | null>(null);
  const [manual, setManual] = useState("");
  const [verifier, setVerifier] = useState("");
  const [verifierState, setVerifierState] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setSt).catch(() => setSt(null));
  }, []);

  const loadInfo = useCallback(async () => {
    if (!contract) return setInfo(null);
    try {
      setInfo(await readContractInfo(contract));
    } catch (e) {
      setError(`No se pudo leer el contrato en Fuji: ${humanError(e)}`);
      setInfo(null);
    }
  }, [contract]);
  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  const deploy = async () => {
    setError(null);
    setBusy("Esperando firma del despliegue…");
    try {
      const { contract: c, tx } = await deployRegistry();
      setDeployTx(tx.hash);
      setBusy("Despliegue enviado. Esperando confirmación…");
      await c.waitForDeployment();
      const addr = await c.getAddress();
      setContractOverride(addr);
      log({ accion: "desplegó EvidenceRegistry en Fuji", entidad: "contract", entidadId: addr, detalle: tx.hash });
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  const setVer = async (enabled: boolean) => {
    if (!contract || !isAddress(verifier)) return;
    setError(null);
    setBusy("Esperando firma…");
    try {
      const tx = await setVerifierTx(contract, verifier, enabled);
      await tx.wait();
      log({ accion: enabled ? "habilitó verificador" : "deshabilitó verificador", entidad: "contract", entidadId: verifier, detalle: tx.hash });
      setVerifierState(`${enabled ? "Habilitado" : "Deshabilitado"} (tx ${tx.hash.slice(0, 10)}…)`);
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  const checkVer = async () => {
    if (!contract || !isAddress(verifier)) return;
    try {
      setVerifierState((await isVerifier(contract, verifier)) ? "Es verificador" : "No es verificador");
    } catch (e) {
      setError(humanError(e));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <PageHeader
        modulo="Transparencia técnica"
        title="Estado técnico de integraciones"
        subtitle="Qué está operativo, qué está preparado y qué falta. Se consulta en vivo; nada de esta tabla está simulado."
      />

      <div className="card overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-slate-500 uppercase">
            <tr>
              <th className="pb-1">Componente</th>
              <th className="pb-1">Estado</th>
              <th className="pb-1">Detalle</th>
            </tr>
          </thead>
          <tbody>
            <Row name="Avalanche Fuji (RPC)" tone={st?.avalanche.rpcReachable ? "ok" : st ? "bad" : "neutral"} state={st ? (st.avalanche.rpcReachable ? "Operativo" : "Sin respuesta") : "Consultando…"}>
              {FUJI.rpcUrl} · chainId {st?.avalanche.chainId ?? "—"}
            </Row>
            <Row name="Contrato EvidenceRegistry" tone={contract ? (info ? "ok" : "warn") : "warn"} state={contract ? (info ? "Desplegado" : "Sin verificar") : "No desplegado"}>
              {contract ? (
                <>
                  <a className="font-mono underline" href={addressUrl(contract)} target="_blank" rel="noreferrer">
                    {contract}
                  </a>
                  {info && ` · ${info.evidenceCount} huella(s) · owner ${info.owner.slice(0, 8)}…`}
                  {!ENV_CONTRACT_ADDRESS && " · dirección guardada en este navegador"}
                </>
              ) : (
                "Código y tests listos (Hardhat). Falta desplegar en Fuji."
              )}
            </Row>
            <Row name="OCI Object Storage" tone={st?.oci.configured ? "ok" : "warn"} state={st?.oci.configured ? "Configurado" : "Preparado, sin credenciales"}>
              {st?.oci.configured ? `Región ${st.oci.region} · bucket ${st.oci.bucket}` : st?.oci.error ?? "Falta OCI_OBJECT_STORAGE_PAR_URL (PAR de escritura)."}
            </Row>
            <Row name="OCI Generative AI" tone="neutral" state="Pendiente">
              {st?.ai.note ?? "No integrado."}
            </Row>
            <Row name="Oracle AI Database / Spatial" tone="neutral" state="Diseñado">
              Esquema SQL en docs/schema.sql; los datos del MVP se sirven desde JSON versionado.
            </Row>
            <Row name="IDESA (WMS/WFS Salta)" tone={st?.idesa.reachable ? "ok" : st ? "bad" : "neutral"} state={st ? (st.idesa.reachable ? "Operativo" : "Sin respuesta") : "Consultando…"}>
              Capas en vivo en el Observatorio; departamentos descargados con scripts/fetch-open-data.mjs.
            </Row>
          </tbody>
        </table>
        {st && <p className="mt-2 text-[11px] text-slate-400">Consultado {new Date(st.checkedAt).toLocaleString("es-AR")}</p>}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="font-bold text-navy-900">Desplegar el contrato desde la wallet</h2>
          {!can(role, "contract:deploy") ? (
            <p className="mt-2 text-sm text-slate-600">Disponible para el rol Administrador.</p>
          ) : ENV_CONTRACT_ADDRESS ? (
            <p className="mt-2 text-sm text-slate-600">La dirección está fijada por variable de entorno; no se requiere despliegue.</p>
          ) : (
            <>
              <p className="mt-2 text-sm text-slate-600">
                Firmás con MetaMask/Core en Fuji (necesitás AVAX de testnet:{" "}
                <a className="underline" href={FUJI.faucet} target="_blank" rel="noreferrer">
                  faucet
                </a>
                ). La dirección resultante se guarda en este navegador; para el despliegue público, copiala a <Mono>NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS</Mono>.
              </p>
              {!hasWallet() && <p className="mt-2 text-xs text-rose-700">No se detectó wallet EVM en este navegador.</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn btn-eco" disabled={!!busy} onClick={deploy}>
                  Desplegar EvidenceRegistry en Fuji
                </button>
                <button className="btn btn-ghost" disabled={!!busy} onClick={() => connectWallet().catch((e) => setError(humanError(e)))}>
                  Conectar wallet
                </button>
              </div>
              {deployTx && (
                <p className="mt-2 text-xs">
                  Tx de despliegue:{" "}
                  <a className="font-mono underline" href={txUrl(deployTx)} target="_blank" rel="noreferrer">
                    {deployTx.slice(0, 18)}…
                  </a>
                </p>
              )}
              <form
                className="mt-4 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (isAddress(manual)) setContractOverride(manual);
                }}
              >
                <input value={manual} onChange={(e) => setManual(e.target.value.trim())} placeholder="…o pegá una dirección ya desplegada (0x…)" className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs" />
                <button className="btn btn-ghost" disabled={!isAddress(manual)}>
                  Usar
                </button>
              </form>
              {contractOverride && (
                <button className="mt-2 text-xs text-rose-700 underline" onClick={() => setContractOverride(null)}>
                  Olvidar dirección guardada
                </button>
              )}
            </>
          )}
        </div>

        <div className="card p-4">
          <h2 className="font-bold text-navy-900">Verificadores independientes</h2>
          <p className="mt-2 text-sm text-slate-600">
            Solo cuentas habilitadas por el owner pueden atestar, y nunca la misma que presentó la evidencia (lo impone el contrato).
          </p>
          <input value={verifier} onChange={(e) => setVerifier(e.target.value.trim())} placeholder="Dirección del verificador (0x…)" className="mt-3 w-full rounded-md border border-slate-300 px-2 py-1.5 font-mono text-xs" />
          <div className="mt-2 flex flex-wrap gap-2">
            <button className="btn btn-ghost" disabled={!contract || !isAddress(verifier)} onClick={checkVer}>
              Consultar
            </button>
            {can(role, "contract:deploy") && (
              <>
                <button className="btn btn-eco" disabled={!contract || !isAddress(verifier) || !!busy} onClick={() => setVer(true)}>
                  Habilitar
                </button>
                <button className="btn btn-ghost" disabled={!contract || !isAddress(verifier) || !!busy} onClick={() => setVer(false)}>
                  Deshabilitar
                </button>
              </>
            )}
          </div>
          {verifierState && <p className="mt-2 text-xs">{verifierState}</p>}
        </div>
      </div>

      {busy && (
        <div className="mt-4">
          <Notice tone="info">{busy}</Notice>
        </div>
      )}
      {error && (
        <div className="mt-4">
          <Notice tone="bad">{error}</Notice>
        </div>
      )}

      <div className="card mt-6 p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-navy-900">Registro de auditoría (este navegador)</h2>
          <button className="btn btn-ghost text-xs" onClick={resetDemo}>
            Reiniciar demo
          </button>
        </div>
        {can(role, "audit:view") ? (
          <ul className="mt-2 max-h-72 divide-y divide-slate-100 overflow-y-auto text-xs">
            {audit.map((a) => (
              <li key={a.id} className="py-1.5">
                <span className="text-slate-400">{new Date(a.fecha).toLocaleString("es-AR")}</span> · <b>{a.actor}</b> {a.accion} · <Mono>{a.entidadId}</Mono>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600">Visible para Gobierno y Administrador.</p>
        )}
      </div>
    </div>
  );
}
