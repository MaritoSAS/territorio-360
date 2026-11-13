# Avalanche — EvidenceRegistry en Fuji

- Red: **Avalanche Fuji C-Chain**, chainId `43113`, RPC `https://api.avax-test.network/ext/bc/C/rpc`.
- Explorador: `https://testnet.snowtrace.io` (configurable con `NEXT_PUBLIC_AVALANCHE_EXPLORER_URL`).
- Contrato: [`contracts/contracts/EvidenceRegistry.sol`](../contracts/contracts/EvidenceRegistry.sol) (Solidity 0.8.24, sin dependencias).

## Interfaz

| Función | Quién | Efecto |
|---|---|---|
| `registerEvidence(bytes32 projectId, bytes32 commitmentId, bytes32 evidenceHash, string offchainRef)` | cualquiera | Ancla la huella. Rechaza hash nulo, duplicados y referencias > 200 bytes. Emite `EvidenceRegistered`. |
| `attestEvidence(bytes32 evidenceHash, Verdict verdict)` | verificadores habilitados | `Contrasted` o `Rejected`. Prohíbe autoatestación y doble atestación. Emite `EvidenceAttested`. |
| `setVerifier(address, bool)` | owner | Habilita/deshabilita verificadores. |
| `isRegistered`, `getEvidence`, `getAttestations`, `evidenceCount` | lectura | Consulta pública. |

`projectId` y `commitmentId` se codifican como `keccak256(utf8(id))` (ej. `keccak256("CMP-01")`).

Registrar una huella **prueba existencia e integridad del archivo en una fecha**, no que su contenido sea verdadero.

## Tests

```bash
cd contracts && npm install && npx hardhat test
```

4 tests: registro y evento; validaciones (hash nulo, duplicado, referencia larga); permisos de atestación (no verificador, autoatestación, doble atestación, verdict nulo); ownership y verificadores.

## Despliegue

**Opción A — desde el MVP (sin claves en el servidor):** rol Administrador → `/estado` → «Desplegar EvidenceRegistry en Fuji». Firma con MetaMask/Core. La dirección queda en el navegador; para el despliegue público copiala a `NEXT_PUBLIC_EVIDENCE_REGISTRY_ADDRESS` y reconstruí.

**Opción B — Hardhat:**

```bash
cd contracts
cp .env.example .env   # DEPLOYER_PRIVATE_KEY de una wallet de PRUEBA con AVAX Fuji
npx hardhat run scripts/deploy.js --network fuji
# escribe deployments/fuji.json con dirección y tx
```

AVAX de testnet: faucet oficial `https://core.app/tools/testnet-faucet/?subnet=c&token=c` (hoy exige saldo en mainnet o cupón).

Luego de cambiar el contrato: `npx hardhat compile && node scripts/export-abi.js` para actualizar el ABI del frontend.

## Estado

- Contrato compilado y testeado localmente: **sí**.
- Desplegado en Fuji: **no** (falta wallet con AVAX de prueba). La UI no muestra transacciones hasta que exista un contrato real.
