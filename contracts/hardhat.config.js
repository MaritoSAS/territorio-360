require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const { FUJI_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: { version: "0.8.24", settings: { optimizer: { enabled: true, runs: 200 } } },
  networks: {
    // HARDHAT_CHAIN_ID=43113 permite pruebas end-to-end locales de la UI imitando el chainId de Fuji.
    hardhat: { chainId: Number(process.env.HARDHAT_CHAIN_ID || 31337) },
    fuji: {
      url: FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
