const hre = require("hardhat");
async function main() {
  const musd = "0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503";
  const mezo = "0x7B7c000000000000000000000000000000000001";
  const vault = "0x0000000000000000000000000000000000000000";
  const c = await hre.ethers.getContractFactory("SafePayEscrow");
  const contract = await c.deploy(musd, mezo, vault);
  await contract.waitForDeployment();
  console.log("DEPLOYED:"+await contract.getAddress());
}
main().catch(e=>{console.error(e); process.exit(1)});
