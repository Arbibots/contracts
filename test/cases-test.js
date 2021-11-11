const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require('fs');

function readCsvFile() {
  const textByLine = fs.readFileSync("data/case_data.csv").toString().split("\n");
  const res = textByLine.map((line) => line.split(","));
  return res;
}

describe("ArbiCases", function() {
  let Arbibots;
  let arbibots;
  let ArbiCases;
  let arbiCases;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  this.beforeEach(async function() {
    Arbibots = await ethers.getContractFactory("Arbibots");
    arbibots = await Arbibots.deploy();

    ArbiCases = await ethers.getContractFactory("ArbiCases");
    arbiCases = await ArbiCases.deploy(arbibots.address);

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
  });

  describe("Redeeming", function () {
    it("Should allow minting if you own a correct tokenId", async function() {
      await arbibots.connect(addr1).mint({value: ethers.utils.parseEther("20.00")});
      await arbiCases.connect(addr1).redeem();
      expect(await arbiCases.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should not allow minting if dont own the correct tokenId", async function() {
      await arbiCases.connect(addr1).redeem();
      expect(await arbiCases.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should allow individual minting if you own a correct tokenId", async function () {
      await arbibots.connect(addr1).mint({value: ethers.utils.parseEther("20.00")});
      await arbiCases.connect(addr1).redeemIndividual(0);
      expect(await arbiCases.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should not allow individual minting if dont own the correct tokenId", async function() {
      await arbibots.connect(addr2).mint({value: ethers.utils.parseEther("20.00")});
      const redeem = arbiCases.connect(addr1).redeemIndividual(0);
      expect(redeem).revertedWith('Minter must be owner');
    });

    it("Should allow minting of everything in csvfile", async function() {
      const valid = new Set();
      const mints = readCsvFile();
      for (let row of mints) {
        valid.add(parseInt(row[0]));
      }

      for (let i = 0; i < 2000; i++) {
        const redeemable = await arbiCases.redeemable(i);
        if (valid.has(i)) {
          expect(redeemable).to.equal(true);
        } else {
          expect(redeemable).to.equal(false);
        }
      }
    });
  });
});