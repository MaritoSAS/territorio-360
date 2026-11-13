"use client";
import { ENV_CONTRACT_ADDRESS } from "@/lib/blockchain/config";
import { useStore } from "@/lib/store";

/** Dirección del EvidenceRegistry: la del entorno tiene prioridad sobre la desplegada desde la UI. */
export function useContractAddress(): { address: string | null; source: "env" | "ui" | null } {
  const { contractOverride } = useStore();
  if (ENV_CONTRACT_ADDRESS) return { address: ENV_CONTRACT_ADDRESS, source: "env" };
  if (contractOverride) return { address: contractOverride, source: "ui" };
  return { address: null, source: null };
}
