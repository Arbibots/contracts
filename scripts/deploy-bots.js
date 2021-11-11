const hre = require("hardhat");

async function main() {
  const Bot = await hre.ethers.getContractFactory("Arbibots");
  const bot = await Bot.deploy();

  await bot.deployed();
  console.log("Bot deployed to:", bot.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
