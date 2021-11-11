const hre = require("hardhat");

async function main() {
  const Bot = await hre.ethers.getContractFactory("Arbibots");
  const bot = await Bot.deploy();

  await bot.deployed();

  const ArbiCases = await hre.ethers.getContractFactory("ArbiCases");
  const arbiCases = await ArbiCases.deploy(bot.address);
  
  await arbiCases.deployed();

  console.log("Bot deployed to:", bot.address);
  console.log("Cases deployed to:", arbiCases.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
