require("@nomicfoundation/hardhat-toolbox");
module.exports = {
  solidity: { version: "0.8.28", settings: { optimizer: { enabled: true, runs: 200 }, evmVersion: "london" } },
  networks: {
    mezoTestnet: { url: "https://rpc.test.mezo.org", chainId: 31611, accounts: [process.env.DEPLOY_KEY ? "0x"+process.env.DEPLOY_KEY.replace(/^0x/,"") : "0x"+"1".repeat(64)] }
  }
};
