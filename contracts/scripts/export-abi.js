// Copia el ABI compilado al frontend: node scripts/export-abi.js (después de `npx hardhat compile`)
const fs = require("node:fs");
const path = require("node:path");
const art = require("../artifacts/contracts/EvidenceRegistry.sol/EvidenceRegistry.json");
const out = path.join(__dirname, "..", "..", "src", "lib", "blockchain", "EvidenceRegistry.abi.json");
fs.writeFileSync(out, JSON.stringify(art.abi, null, 2));
fs.writeFileSync(path.join(__dirname, "..", "..", "src", "lib", "blockchain", "EvidenceRegistry.bytecode.json"), JSON.stringify({ bytecode: art.bytecode }));
console.log("ABI y bytecode exportados a src/lib/blockchain/");
