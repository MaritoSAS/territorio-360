const { ethers, network } = require("hardhat");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("Falta DEPLOYER_PRIVATE_KEY en contracts/.env");
  console.log(`Red: ${network.name} — deployer: ${deployer.address}`);
  const reg = await (await ethers.getContractFactory("EvidenceRegistry")).deploy();
  await reg.waitForDeployment();
  const address = await reg.getAddress();
  const tx = reg.deploymentTransaction();
  console.log(`EvidenceRegistry: ${address}\nTx: ${tx.hash}`);

  const out = path.join(__dirname, "..", "deployments", `${network.name}.json`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(
    out,
    JSON.stringify({ network: network.name, chainId: Number(network.config.chainId), address, txHash: tx.hash, deployer: deployer.address, deployedAt: new Date().toISOString() }, null, 2)
  );
  console.log(`Guardado en ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
