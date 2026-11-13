export const FUJI = {
  chainId: Number(process.env.NEXT_PUBLIC_AVALANCHE_CHAIN_ID ?? 43113),
  chainIdHex: `0x${Number(process.env.NEXT_PUBLIC_AVALANCHE_CHAIN_ID ?? 43113).toString(16)}`,
  name: "Avalanche Fuji C-Chain",
  rpcUrl: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
  explorer: (process.env.NEXT_PUBLIC_AVALANCHE_EXPLORER_URL || "https://testnet.snowtrace.io").replace(/\/$/, ""),
  faucet: "https://core.app/tools/testnet-faucet/?subnet=c&token=c",
};

/** Dirección configurada por entorno. Puede sobreescribirse en el navegador tras desplegar desde la UI. */
export const ENV_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS || "";

export const txUrl = (hash: string) => `${FUJI.explorer}/tx/${hash}`;
export const addressUrl = (addr: string) => `${FUJI.explorer}/address/${addr}`;
