"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DemoBadge, Mono, Notice, OdsChip, PageHeader, StatusPill, ValidationBadge } from "@/components/ui";
import { actorName, commitments, DEMO_EVIDENCE_FILE, evidences, projects, territoryName } from "@/data/demo";
import { FUJI, txUrl, addressUrl } from "@/lib/blockchain/config";
import { attestEvidenceTx, hasWallet, humanError, readEvidence, readProvider, registerEvidenceTx, type OnchainEvidence } from "@/lib/blockchain/registry";
import { useContractAddress } from "@/lib/blockchain/useContractAddress";
import { sha256File, shortHash } from "@/lib/hash";
import { can } from "@/lib/roles";
import { effectiveStatus, fmtDate, STATUS_LABEL } from "@/lib/status";
import { useStore, type EvidenceSubmission } from "@/lib/store";
import type { ValidationStatus } from "@/lib/types";

const MAX_BYTES = 10 * 1024 * 1024;

interface Picked {
  file: File;
  sha256: string;
}

function Step({ n, title, children, done }: { n: number; title: string; children: React.ReactNode; done?: boolean }) {
  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white ${done ? "bg-eco-600" : "bg-navy-800"}`}>
          {done ? "✓" : n}
        </span>
        <h3 className="font-semibold text-navy-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TxStatus({ tx }: { tx: NonNullable<EvidenceSubmission["tx"]> }) {
  const tone = tx.status === "confirmed" ? "ok" : tx.status === "pending" ? "warn" : "bad";
  const label = tx.status === "confirmed" ? `Confirmada · bloque ${tx.blockNumber}` : tx.status === "pending" ? "Pendiente de confirmación" : "Fallida";
  return (
    <div className="space-y-1 text-xs">
      <StatusPill tone={tone}>{label}</StatusPill>
      <p>
        Tx:{" "}
        <a className="font-mono text-navy-700 underline" href={txUrl(tx.hash)} target="_blank" rel="noreferrer">
          {shortHash(tx.hash)}
        </a>{" "}
        (Snowtrace testnet)
      </p>
    </div>
  );
}

export default function Pasaporte() {
  const { role, submissions, upsertSubmission, log } = useStore();
  const { address: contract, source } = useContractAddress();
  const [cmpId, setCmpId] = useState("CMP-01");
  const [picked, setPicked] = useState<Picked | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ociConfigured, setOciConfigured] = useState<boolean | null>(null);
  const [current, setCurrent] = useState<EvidenceSubmission | null>(null);
  const [verify, setVerify] = useState<{ name: string; sha256: string; local: EvidenceSubmission[]; onchain: OnchainEvidence | null; onchainError?: string } | null>(null);

  const cmp = commitments.find((c) => c.id === cmpId)!;
  const project = projects.find((p) => p.id === cmp.projectId)!;
  const canSubmit = can(role, "evidence:submit");
  const canAttest = can(role, "evidence:attest");
  const mine = submissions.filter((s) => s.commitmentId === cmpId);
  const demoEv = evidences.filter((e) => e.commitmentId === cmpId);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((j) => setOciConfigured(Boolean(j?.oci?.configured)))
      .catch(() => setOciConfigured(false));
  }, []);

  const pick = async (file: File | Blob, name?: string) => {
    setError(null);
    setCurrent(null);
    const f = file instanceof File ? file : new File([file], name ?? "archivo", { type: file.type });
    if (f.size > MAX_BYTES) return setError("El archivo supera 10 MB.");
    setBusy("Calculando SHA-256…");
    try {
      setPicked({ file: f, sha256: await sha256File(f) });
    } finally {
      setBusy(null);
    }
  };

  const useDemoFile = async () => {
    const r = await fetch(DEMO_EVIDENCE_FILE);
    await pick(await r.blob(), "informe-tecnico-demostrativo.pdf");
  };

  const saveLocal = (): EvidenceSubmission => {
    const sub: EvidenceSubmission = {
      id: `SUB-${Date.now().toString(36).toUpperCase()}`,
      commitmentId: cmp.id,
      projectId: project.id,
      fileName: picked!.file.name,
      fileSize: picked!.file.size,
      sha256: picked!.sha256,
      createdAt: new Date().toISOString(),
      role,
      ociObject: null,
      tx: null,
    };
    upsertSubmission(sub);
    setCurrent(sub);
    log({ accion: "calculó huella SHA-256 de evidencia", entidad: "evidence", entidadId: sub.id });
    return sub;
  };

  const uploadOci = async () => {
    if (!picked) return;
    const sub = current ?? saveLocal();
    setBusy("Subiendo a OCI Object Storage…");
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", picked.file);
      fd.append("commitmentId", cmp.id);
      fd.append("sha256", picked.sha256);
      const r = await fetch("/api/oci/evidence", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `HTTP ${r.status}`);
      const next = { ...sub, ociObject: { name: j.objectName as string, uploadedAt: new Date().toISOString() } };
      upsertSubmission(next);
      setCurrent(next);
      log({ accion: "subió evidencia a OCI Object Storage", entidad: "evidence", entidadId: sub.id });
    } catch (e) {
      setError(`OCI: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  const anchor = async () => {
    if (!picked || !contract) return;
    setError(null);
    setBusy("Comprobando si la huella ya existe en el contrato…");
    try {
      const existing = await readEvidence(contract, picked.sha256);
      if (existing.registered) {
        setError(
          `Esa huella ya fue registrada en el bloque ${existing.blockNumber} por ${shortHash(existing.submitter ?? "", 6)}. No se vuelve a registrar: usá «Verificar evidencia» para consultarla.`
        );
        return;
      }
      const sub = current ?? saveLocal();
      setBusy("Esperando firma en la wallet…");
      const ref = sub.ociObject?.name ? `oci:${sub.ociObject.name}` : `t360:${sub.id}`;
      const { tx, from } = await registerEvidenceTx(contract, project.id, cmp.id, picked.sha256, ref);
      let next: EvidenceSubmission = { ...sub, tx: { hash: tx.hash, chainId: FUJI.chainId, contract, status: "pending", from } };
      upsertSubmission(next);
      setCurrent(next);
      log({ accion: "envió registro de huella a Avalanche Fuji", entidad: "blockchain_tx", entidadId: tx.hash });
      setBusy("Transacción enviada. Esperando confirmación en Fuji…");
      const receipt = await tx.wait();
      next = { ...next, tx: { ...next.tx!, status: receipt?.status === 1 ? "confirmed" : "failed", blockNumber: receipt?.blockNumber } };
      upsertSubmission(next);
      setCurrent(next);
      log({ accion: receipt?.status === 1 ? "registro confirmado on-chain" : "registro on-chain fallido", entidad: "blockchain_tx", entidadId: tx.hash });
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  const refreshTx = useCallback(
    async (s: EvidenceSubmission) => {
      if (!s.tx) return;
      const r = await readProvider().getTransactionReceipt(s.tx.hash);
      if (!r) return;
      upsertSubmission({ ...s, tx: { ...s.tx, status: r.status === 1 ? "confirmed" : "failed", blockNumber: r.blockNumber } });
    },
    [upsertSubmission]
  );

  const runVerify = async (file: File) => {
    setBusy("Verificando…");
    setError(null);
    try {
      const sha = await sha256File(file);
      const local = [
        ...submissions.filter((s) => s.sha256 === sha),
        ...evidences.filter((e) => e.sha256 === sha).map((e) => ({ commitmentId: e.commitmentId, projectId: e.projectId }) as EvidenceSubmission),
      ];
      let onchain: OnchainEvidence | null = null;
      let onchainError: string | undefined;
      if (contract) {
        try {
          const ref = local[0];
          onchain = await readEvidence(contract, sha, ref?.projectId, ref?.commitmentId);
        } catch (e) {
          onchainError = humanError(e);
        }
      }
      setVerify({ name: file.name, sha256: sha, local, onchain, onchainError });
    } finally {
      setBusy(null);
    }
  };

  const attest = async (verdict: 1 | 2) => {
    if (!verify || !contract) return;
    setBusy("Esperando firma de la atestación…");
    setError(null);
    try {
      const tx = await attestEvidenceTx(contract, verify.sha256, verdict);
      log({ accion: verdict === 1 ? "atestó evidencia como contrastada" : "rechazó evidencia", entidad: "blockchain_tx", entidadId: tx.hash });
      setBusy("Esperando confirmación de la atestación…");
      await tx.wait();
      setVerify({ ...verify, onchain: await readEvidence(contract, verify.sha256) });
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  };

  const level = (s: EvidenceSubmission): ValidationStatus => (s.tx?.status === "confirmed" || s.ociObject ? "documentado" : "declarado");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <PageHeader
        modulo="Módulo 07 · Pantalla 4"
        title="Pasaporte de Impacto"
        subtitle="Cada compromiso con su responsable, fecha, evidencia y huella SHA-256 anclada en Avalanche Fuji. El documento no se publica: solo su huella."
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
        <div className="card p-4">
          <label className="text-xs font-bold text-slate-500 uppercase">Compromiso</label>
          <select value={cmpId} onChange={(e) => { setCmpId(e.target.value); setCurrent(null); }} className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm">
            {commitments.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id} — {c.titulo}
              </option>
            ))}
          </select>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-navy-900">{cmp.titulo}</h2>
            <DemoBadge />
          </div>
          <p className="mt-1 text-sm text-slate-600">{cmp.descripcion}</p>
          <dl className="mt-3 grid grid-cols-[120px_1fr] gap-y-1.5 text-sm">
            <dt className="text-slate-500">Proyecto</dt>
            <dd>{project.nombre}</dd>
            <dt className="text-slate-500">Responsable</dt>
            <dd>
              {actorName(cmp.responsableActorId)} · {cmp.responsableCargo}
            </dd>
            <dt className="text-slate-500">Alta / límite</dt>
            <dd>
              {fmtDate(cmp.fechaAlta)} → {fmtDate(cmp.fechaLimite)}
            </dd>
            <dt className="text-slate-500">Estado</dt>
            <dd>
              <StatusPill tone={effectiveStatus(cmp) === "vencido" ? "bad" : effectiveStatus(cmp) === "cumplido" ? "ok" : "info"}>{STATUS_LABEL[effectiveStatus(cmp)]}</StatusPill>{" "}
              <span className="text-xs text-slate-500">avance declarado {cmp.avance}%</span>
            </dd>
            <dt className="text-slate-500">Territorio</dt>
            <dd>{cmp.territorioIds.map(territoryName).join(", ")}</dd>
            <dt className="text-slate-500">ODS</dt>
            <dd className="flex flex-wrap gap-1">
              {cmp.ods.map((o) => (
                <OdsChip key={o} n={o} />
              ))}
            </dd>
            <dt className="text-slate-500">Referencias</dt>
            <dd className="text-xs">{cmp.referenciasIso.join(" · ")} (orientativas, no implican certificación)</dd>
          </dl>
          <h3 className="mt-5 mb-2 text-xs font-bold text-slate-500 uppercase">Evidencias del compromiso</h3>
          <ul className="space-y-2 text-sm">
            {demoEv.map((e) => (
              <li key={e.id} className="rounded-lg border border-slate-200 p-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{e.titulo}</span>
                  <ValidationBadge status={e.validacion} />
                  <DemoBadge />
                </div>
                <p className="text-xs text-slate-500">
                  {fmtDate(e.fecha)} · {actorName(e.actorId)} · {e.sha256 ? "huella calculada, sin anclar" : "sin archivo"}
                </p>
                {e.sha256 && <Mono className="text-[11px]">sha256 {shortHash(e.sha256, 12)}</Mono>}
                {e.archivoRef && (
                  <a className="ml-2 text-[11px] text-navy-700 underline" href={e.archivoRef} target="_blank" rel="noreferrer">
                    ver archivo
                  </a>
                )}
              </li>
            ))}
            {mine.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-200 p-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{s.fileName}</span>
                  <ValidationBadge status={level(s)} />
                  <span className="text-[11px] text-slate-500">presentada en esta sesión</span>
                </div>
                <Mono className="text-[11px]">sha256 {shortHash(s.sha256, 12)}</Mono>
                {s.ociObject && <p className="text-[11px] text-slate-500">OCI: {s.ociObject.name}</p>}
                {s.tx ? (
                  <div className="mt-1 flex items-center gap-2">
                    <TxStatus tx={s.tx} />
                    {s.tx.status === "pending" && (
                      <button className="btn btn-ghost text-xs" onClick={() => refreshTx(s)}>
                        Actualizar
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">Sin registro on-chain.</p>
                )}
              </li>
            ))}
            {!demoEv.length && !mine.length && <li className="text-xs text-slate-500">Sin evidencias aún.</li>}
          </ul>
        </div>

        <div className="space-y-4">
          {!canSubmit && (
            <Notice tone="info" title="Presentación de evidencia">
              Con el rol actual no podés presentar evidencias (lo hace la Empresa responsable). Podés verificar archivos abajo
              {canAttest ? " y atestar como verificador gubernamental" : ""}.
            </Notice>
          )}
          {canSubmit && (
            <>
              <Step n={1} title="Adjuntar evidencia y calcular SHA-256" done={!!picked}>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="btn btn-primary cursor-pointer">
                    Elegir archivo
                    <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])} />
                  </label>
                  <button className="btn btn-ghost" onClick={useDemoFile}>
                    Usar informe demostrativo (PDF)
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">El hash se calcula en tu navegador. El archivo no se sube a ningún lado salvo que elijas OCI (paso 2).</p>
                {picked && (
                  <div className="mt-3 rounded-lg bg-canvas p-3 text-xs">
                    <p>
                      <b>{picked.file.name}</b> · {(picked.file.size / 1024).toFixed(1)} KB
                    </p>
                    <p className="mt-1 break-all">
                      SHA-256: <Mono>{picked.sha256}</Mono>
                    </p>
                  </div>
                )}
              </Step>

              <Step n={2} title="Guardar el documento en OCI Object Storage (opcional)" done={!!current?.ociObject}>
                {ociConfigured === false && (
                  <Notice tone="warn" title="OCI no configurado">
                    Este despliegue no tiene <Mono>OCI_OBJECT_STORAGE_PAR_URL</Mono>. La integración está implementada en el backend pero no se probó
                    contra OCI. Podés seguir: la huella se ancla igual y el documento queda en tu equipo.
                  </Notice>
                )}
                {ociConfigured && (
                  <button className="btn btn-ghost" disabled={!picked || !!busy || !!current?.ociObject} onClick={uploadOci}>
                    Subir a OCI (verifica el hash en el servidor)
                  </button>
                )}
                {current?.ociObject && <p className="mt-2 text-xs text-eco-700">Guardado en OCI como {current.ociObject.name}</p>}
              </Step>

              <Step n={3} title="Registrar la huella en Avalanche Fuji" done={current?.tx?.status === "confirmed"}>
                {!contract ? (
                  <Notice tone="warn" title="Contrato no desplegado">
                    No hay dirección de <Mono>EvidenceRegistry</Mono> configurada. Un administrador puede desplegarlo desde{" "}
                    <Link className="underline" href="/estado">
                      Estado técnico
                    </Link>{" "}
                    con su wallet, o definir <Mono>NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS</Mono>. No se muestra ninguna transacción simulada.
                  </Notice>
                ) : (
                  <>
                    <p className="text-xs text-slate-600">
                      Contrato ({source === "env" ? "configurado en el entorno" : "desplegado desde la UI"}):{" "}
                      <a className="font-mono underline" href={addressUrl(contract)} target="_blank" rel="noreferrer">
                        {shortHash(contract, 8)}
                      </a>
                    </p>
                    {!hasWallet() && <p className="mt-1 text-xs text-rose-700">No se detectó wallet EVM (MetaMask/Core) en este navegador.</p>}
                    <button className="btn btn-eco mt-2" disabled={!picked || !!busy || !!current?.tx} onClick={anchor}>
                      Firmar y registrar en Fuji
                    </button>
                    <p className="mt-1 text-[11px] text-slate-500">Se registran: proyecto, compromiso, hash, emisor, bloque y referencia off-chain. Requiere AVAX de testnet para gas.</p>
                  </>
                )}
                {current && !current.tx && !contract && (
                  <p className="mt-2 text-xs text-slate-600">Huella guardada localmente (nivel «Declarado» hasta anclarla o almacenarla).</p>
                )}
                {current?.tx && (
                  <div className="mt-3">
                    <TxStatus tx={current.tx} />
                  </div>
                )}
                {picked && !current && !contract && (
                  <button className="btn btn-ghost mt-2" onClick={saveLocal}>
                    Guardar huella localmente
                  </button>
                )}
              </Step>
            </>
          )}

          <div className="card p-4">
            <h3 className="font-semibold text-navy-900">Verificar evidencia</h3>
            <p className="mt-1 text-xs text-slate-600">
              Cargá un archivo: se recalcula su SHA-256 y se compara con el registro local y con el contrato en Fuji. Coincidencia prueba integridad y
              existencia en una fecha; no prueba que el contenido sea veraz.
            </p>
            <label className="btn btn-ghost mt-3 cursor-pointer">
              Elegir archivo a verificar
              <input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && runVerify(e.target.files[0])} />
            </label>
            {verify && (
              <div className="mt-3 space-y-2 text-xs">
                <p className="break-all">
                  <b>{verify.name}</b> → <Mono>{verify.sha256}</Mono>
                </p>
                <p>
                  Registro local: {verify.local.length ? <StatusPill tone="ok">Coincide ({verify.local[0].commitmentId})</StatusPill> : <StatusPill tone="neutral">Sin coincidencias</StatusPill>}
                </p>
                {!contract && <p className="text-slate-500">Sin contrato configurado: no se consultó la blockchain.</p>}
                {verify.onchainError && <p className="text-rose-700">Error al consultar Fuji: {verify.onchainError}</p>}
                {verify.onchain && (
                  <div>
                    {verify.onchain.registered ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill tone="ok">Huella registrada on-chain</StatusPill>
                          <ValidationBadge status={verify.onchain.attestations.some((a) => a.verdict === 1) ? "verificado" : "documentado"} />
                        </div>
                        <p className="mt-1">
                          Bloque {verify.onchain.blockNumber} · {new Date((verify.onchain.timestamp ?? 0) * 1000).toLocaleString("es-AR")} · emisor{" "}
                          <a className="font-mono underline" href={addressUrl(verify.onchain.submitter!)} target="_blank" rel="noreferrer">
                            {shortHash(verify.onchain.submitter!, 6)}
                          </a>
                        </p>
                        <p>Ref. off-chain: {verify.onchain.offchainRef || "—"}</p>
                        <p>
                          Atestaciones:{" "}
                          {verify.onchain.attestations.length
                            ? verify.onchain.attestations.map((a) => `${shortHash(a.verifier, 5)} (${a.verdict === 1 ? "contrastada" : "rechazada"})`).join(", ")
                            : "ninguna — la evidencia está documentada, no verificada por terceros"}
                        </p>
                        {canAttest && (
                          <div className="mt-2 flex gap-2">
                            <button className="btn btn-eco" disabled={!!busy} onClick={() => attest(1)}>
                              Atestar como contrastada
                            </button>
                            <button className="btn btn-ghost" disabled={!!busy} onClick={() => attest(2)}>
                              Rechazar
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <StatusPill tone="bad">No registrada en el contrato</StatusPill>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {busy && <Notice tone="info">{busy}</Notice>}
          {error && <Notice tone="bad">{error}</Notice>}
        </div>
      </div>
    </div>
  );
}
