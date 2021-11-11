const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Arbibots", function () {
  let Arbibots;
  let arbibots;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function() {
    Arbibots = await ethers.getContractFactory("Arbibots");
    arbibots = await Arbibots.deploy();
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
  });

  describe("Minting", function () {
    it("Should fail to mint under price", async function () {
      const mint = arbibots.connect(addr1).mint({value: ethers.utils.parseEther("0.00")});
      await expect(mint).revertedWith("Price not met");
    });

    it("Should succeed to mint at price", async function () {
      await arbibots.connect(addr1).mint({value: ethers.utils.parseEther("20.00")});
      expect(await arbibots.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should reset auction after full pool", async function () {
      const maxSupply = await arbibots.MAX_BOTS();
      const totalRewardPools = await arbibots.TOTAL_REWARD_POOLS();
      const tokensPerPool = maxSupply / totalRewardPools;
      for (let i = 0; i < tokensPerPool; i++) {
        const price = await arbibots.mintPrice();
        await arbibots.connect(addr1).mint({value: price});
      }
      const price = await arbibots.mintPrice();
      expect(price).to.equal(ethers.utils.parseEther("20.00"));
    });

    it("Should only mint up to max supply", async function () {
      const maxSupply = await arbibots.MAX_BOTS();
      for (let i = 0; i < maxSupply; i++) {
        const price = await arbibots.mintPrice();
        await arbibots.connect(addr1).mint({value: price});
      }
      const price = await arbibots.mintPrice();
      const mint = arbibots.connect(addr1).mint({value: price})
      expect(mint).revertedWith("No more supply");
    });

    it("Should decrease in price until auction reaches limit", async function () {
      expect(await arbibots.mintPrice()).to.equal(ethers.utils.parseEther("20.00"));
      
      const expectedPrices = ["16.066648456705818083", "12.133296913411636165", "8.199945370117454248", "4.26659382682327233", "0.333333333333333334", "0.01"]
      for (let i = 0; i < 6; i++) {
        await ethers.provider.send("evm_increaseTime", [3600]);
        await ethers.provider.send('evm_mine');
        expect(await arbibots.mintPrice()).to.equal(ethers.utils.parseEther(expectedPrices[i]));
      }
    });

    it("Should stay at min price after auction reaches limit", async function () {
      expect(await arbibots.mintPrice()).to.equal(ethers.utils.parseEther("20.00"));
      await ethers.provider.send("evm_increaseTime", [172800]);
      await ethers.provider.send('evm_mine');
      expect(await arbibots.mintPrice()).to.equal(ethers.utils.parseEther("0.01"));
    });
  });

  describe("Rewards", function () {
    it("Shouldn't allow claims before unlock period", async function () {
      const maxSupply = await arbibots.MAX_BOTS();
      const totalRewardPools = await arbibots.TOTAL_REWARD_POOLS();
      const tokensPerPool = maxSupply / totalRewardPools;
      for (let i = 0; i < tokensPerPool-1; i++) {
        const price = await arbibots.mintPrice();
        await arbibots.connect(addr1).mint({value: price});
      }

      const balanceBeforeRedeem = await ethers.provider.getBalance(addr1.address);
      await arbibots.connect(addr1).redeem();
      expect(balanceBeforeRedeem.sub(await ethers.provider.getBalance(addr1.address)).lt(ethers.utils.parseEther("0.001"))).to.equal(true);
    });

    it("Should allow for claims after unlock period", async function () {
      const maxSupply = await arbibots.MAX_BOTS();
      const totalRewardPools = await arbibots.TOTAL_REWARD_POOLS();
      const tokensPerPool = maxSupply / totalRewardPools;
      for (let i = 0; i < tokensPerPool; i++) {
        const price = await arbibots.mintPrice();
        await arbibots.connect(addr1).mint({value: price});
      }

      const balanceBeforeRedeem = await ethers.provider.getBalance(addr1.address);
      await arbibots.connect(addr1).redeem();
      expect((await ethers.provider.getBalance(addr1.address)).sub(balanceBeforeRedeem).gt(ethers.utils.parseEther("40"))).to.equal(true);
    });

    it("Should allow for all claims after all unlock periods", async function () {
      const maxSupply = await arbibots.MAX_BOTS();
      for (let i = 0; i < maxSupply; i++) {
        const price = await arbibots.mintPrice();
        await arbibots.connect(addr1).mint({value: price});
      }

      const balanceBeforeRedeem = await ethers.provider.getBalance(addr1.address);
      await arbibots.connect(addr1).redeem();
      expect((await ethers.provider.getBalance(addr1.address)).sub(balanceBeforeRedeem).gt(ethers.utils.parseEther("400"))).to.equal(true);
    });

    it("Shouldn't allow for a non-owner to redeem", async function () {
      const maxSupply = await arbibots.MAX_BOTS();
      for (let i = 0; i < maxSupply; i++) {
        const price = await arbibots.mintPrice();
        await arbibots.connect(addr2).mint({value: price});
      }

      const balanceBeforeRedeem = await ethers.provider.getBalance(addr1.address);
      await arbibots.connect(addr1).redeem();
      expect((await ethers.provider.getBalance(addr1.address)).sub(balanceBeforeRedeem).lt(ethers.utils.parseEther("0.01"))).to.equal(true);
    });

    it("Should not have any eth leftover after all withdrawals", async function () {
      const maxSupply = await arbibots.MAX_BOTS();
      for (let i = 0; i < maxSupply; i++) {
        const price = await arbibots.mintPrice();
        await arbibots.connect(addr2).mint({value: price});
      }

      await arbibots.connect(addr2).redeem();
      expect(await ethers.provider.getBalance(arbibots.address)).to.equal(0);
    });
  });
});
