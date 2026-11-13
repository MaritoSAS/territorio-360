"use client";

import { BrowserProvider, Contract, ContractFactory, JsonRpcProvider, id as keccakId, isAddress, type Eip1193Provider } from "ethers";
import abi from "./EvidenceRegistry.abi.json";
import bytecodeJson from "./EvidenceRegistry.bytecode.json";
import { FUJI } from "./config";

declare global {
  interface Window {
    ethereum?: Eip1193Provider & { on?: (ev: string, cb: (...a: unknown[]) => void) => void };
  }
}

/** Identificadores on-chain: keccak256 del identificador legible (p. ej. "PDP-01"). */
export const toBytes32Id = (s: string) => keccakId(s);
export const sha256ToBytes32 = (hex: string) => (hex.startsWith("0x") ? hex : `0x${hex}`) as `0x${string}`;

export const readProvider = () => new JsonRpcProvider(FUJI.rpcUrl, FUJI.chainId, { staticNetwork: true });

export function hasWallet() {
  return typeof window !== "undefined" && !!window.ethereum;
}

export async function connectWallet() {
  if (!window.ethereum) throw new Error("No se detectó una wallet (MetaMask o Core). Instalá una extensión compatible con EVM.");
  const provider = new BrowserProvider(window.ethereum);
  await provider.send("eth_requestAccounts", []);
  const net = await provider.getNetwork();
  if (Number(net.chainId) !== FUJI.chainId) {
    try {
      await provider.send("wallet_switchEthereumChain", [{ chainId: FUJI.chainIdHex }]);
    } catch (e: unknown) {
      const code = (e as { code?: number; error?: { code?: number } })?.code ?? (e as { error?: { code?: number } })?.error?.code;
      if (code !== 4902) throw e;
      await provider.send("wallet_addEthereumChain", [
        {
          chainId: FUJI.chainIdHex,
          chainName: FUJI.name,
          nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
          rpcUrls: [FUJI.rpcUrl],
          blockExplorerUrls: [FUJI.explorer],
        },
      ]);
    }
  }
  const fresh = new BrowserProvider(window.ethereum);
  const signer = await fresh.getSigner();
  return { provider: fresh, signer, address: await signer.getAddress() };
}

export async function assertContract(address: string) {
  if (!isAddress(address)) throw new Error("La dirección del contrato no es válida.");
  const code = await readProvider().getCode(address);
  if (!code || code === "0x") throw new Error(`No hay un contrato desplegado en ${address} en ${FUJI.name}.`);
}

export async function registerEvidenceTx(address: string, projectId: string, commitmentId: string, sha256Hex: string, offchainRef: string) {
  const { signer, address: from } = await connectWallet();
  const c = new Contract(address, abi, signer);
  const tx = await c.registerEvidence(toBytes32Id(projectId), toBytes32Id(commitmentId), sha256ToBytes32(sha256Hex), offchainRef);
  return { tx, from };
}

export async function attestEvidenceTx(address: string, sha256Hex: string, verdict: 1 | 2) {
  const { signer } = await connectWallet();
  const c = new Contract(address, abi, signer);
  return c.attestEvidence(sha256ToBytes32(sha256Hex), verdict);
}

export interface OnchainEvidence {
  registered: boolean;
  projectIdMatches?: boolean;
  commitmentIdMatches?: boolean;
  submitter?: string;
  timestamp?: number;
  blockNumber?: number;
  offchainRef?: string;
  attestations: { verifier: string; verdict: number; timestamp: number }[];
}

export async function readEvidence(address: string, sha256Hex: string, projectId?: string, commitmentId?: string): Promise<OnchainEvidence> {
  const c = new Contract(address, abi, readProvider());
  const h = sha256ToBytes32(sha256Hex);
  const registered: boolean = await c.isRegistered(h);
  if (!registered) return { registered, attestations: [] };
  const ev = await c.getEvidence(h);
  const att = await c.getAttestations(h);
  return {
    registered,
    projectIdMatches: projectId ? ev.projectId === toBytes32Id(projectId) : undefined,
    commitmentIdMatches: commitmentId ? ev.commitmentId === toBytes32Id(commitmentId) : undefined,
    submitter: ev.submitter,
    timestamp: Number(ev.timestamp),
    blockNumber: Number(ev.blockNumber),
    offchainRef: ev.offchainRef,
    attestations: att.map((a: { verifier: string; verdict: bigint; timestamp: bigint }) => ({
      verifier: a.verifier,
      verdict: Number(a.verdict),
      timestamp: Number(a.timestamp),
    })),
  };
}

export async function deployRegistry() {
  const { signer, address } = await connectWallet();
  const factory = new ContractFactory(abi, bytecodeJson.bytecode, signer);
  const contract = await factory.deploy();
  return { contract, deployer: address, tx: contract.deploymentTransaction()! };
}

export async function setVerifierTx(address: string, verifier: string, enabled: boolean) {
  const { signer } = await connectWallet();
  return new Contract(address, abi, signer).setVerifier(verifier, enabled);
}

export async function readContractInfo(address: string) {
  const c = new Contract(address, abi, readProvider());
  const [owner, count] = await Promise.all([c.owner(), c.evidenceCount()]);
  return { owner: owner as string, evidenceCount: Number(count) };
}

export async function isVerifier(address: string, who: string) {
  return (await new Contract(address, abi, readProvider()).isVerifier(who)) as boolean;
}

export function humanError(e: unknown): string {
  const err = e as {
    code?: string | number;
    shortMessage?: string;
    reason?: string;
    message?: string;
    revert?: { name?: string };
    info?: { error?: { message?: string } };
  };
  if (err?.code === "ACTION_REJECTED" || err?.code === 4001) return "Operación rechazada en la wallet.";
  const msg = [err?.revert?.name, err?.reason, err?.shortMessage, err?.info?.error?.message, err?.message].filter(Boolean).join(" — ") || String(e);
  if (/AlreadyRegistered/.test(msg)) return "Esa huella ya está registrada en el contrato.";
  if (/SelfAttestation/.test(msg)) return "El emisor de una evidencia no puede atestarla.";
  if (/NotVerifier/.test(msg)) return "La cuenta conectada no está habilitada como verificadora en el contrato.";
  if (/AlreadyAttested/.test(msg)) return "Esta cuenta ya atestó la evidencia.";
  if (/insufficient funds/i.test(msg)) return "Saldo insuficiente de AVAX de prueba en Fuji (usá el faucet).";
  return msg;
}
