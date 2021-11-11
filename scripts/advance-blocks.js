const hre = require("hardhat");

const MINE_AMOUNT = 1000;

async function main() {
    for (let i = 0; i < MINE_AMOUNT; i++ ) {
        await hre.ethers.provider.send('evm_mine');
    }
}
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
  