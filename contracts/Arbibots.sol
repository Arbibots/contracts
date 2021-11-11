// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./BotRenderer.sol";

contract Arbibots is BotRenderer, ERC721Enumerable, ERC721Burnable, Ownable, ReentrancyGuard {
  event Mint(address indexed owner, uint256 indexed tokenId, uint256 price);
  event Redeem(address indexed owner, uint256 value);

  uint256 public constant MAX_BOTS = 2000;

  uint256 public constant TOTAL_REWARD_POOLS = 80;
  uint256[TOTAL_REWARD_POOLS] public rewardPools;
  mapping(uint256 => bool[TOTAL_REWARD_POOLS]) public redeemed;

  uint256 private _auctionStartedAt;
  uint256 private _currentRewardPool;

  constructor() ERC721("Arbibots", "BOT") {
    _auctionStartedAt = block.timestamp;
  }

  // mint related functions

  function mint() public payable nonReentrant {
    // supply and daily supply limits
    uint256 nextId = totalSupply();
    require(nextId < MAX_BOTS, "No more supply");

    // pricing and rewards
    require(msg.value >= mintPrice(), "Price not met");
    uint256 rewardRemainder = _reward(nextId, msg.value);

    // actual minting
    _saveSeed(nextId);
    _safeMint(msg.sender, nextId);
    emit Mint(msg.sender, nextId, msg.value);

    _checkAndHandleNewAuction(nextId+1);

    // owner send
    (bool success, ) = owner().call{value: rewardRemainder}(""); // remainder (50%) goes to owner
    require(success, "Transfer failed");
  }

  function mintPrice() public view returns (uint256) {
    uint256 secondsSinceAuctionStart = _secondsSinceAuctionStart();
    if (secondsSinceAuctionStart < 18000) {
      return 2 * 10**19 - (2 * 10**19 * secondsSinceAuctionStart) / 18305;
    }
    if (secondsSinceAuctionStart < 21492) {
      return 2 * 10**18 - (2 * 10**18 * secondsSinceAuctionStart) / 21600;
    }
    return 10**16; // min price is 0.01 ETH
  }

  // reward related functions

  function redeem() public nonReentrant {
    uint256 toRedeem;
    uint256 maxRewardPoolSlot = totalSupply() / (MAX_BOTS / TOTAL_REWARD_POOLS);

    uint256 owned = balanceOf(msg.sender);
    for (uint256 i = 0; i < owned; i++) {
      uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
      uint256 rewardPoolSlotStartAt = tokenId / (MAX_BOTS / TOTAL_REWARD_POOLS);
      for (uint256 j = rewardPoolSlotStartAt; j < maxRewardPoolSlot; j++) {
        if (redeemed[tokenId][j]) {
          continue;
        }
        redeemed[tokenId][j] = true;
        toRedeem += rewardPools[j];
      }
    }

    (bool success, ) = msg.sender.call{value: toRedeem}("");
    require(success, "Transfer failed");
    emit Redeem(msg.sender, toRedeem);
  }

  function _reward(uint256 tokenId, uint256 saleAmount) private returns (uint256) {
    uint256 rewardPoolSlot = tokenId / (MAX_BOTS / TOTAL_REWARD_POOLS);
    uint256 tokensToSplitAcross = (rewardPoolSlot+1) * (MAX_BOTS / TOTAL_REWARD_POOLS); // take advantage of div flooring
    uint256 individualRewardAmount = (saleAmount / 2) / tokensToSplitAcross;
    rewardPools[rewardPoolSlot] += individualRewardAmount;

    return saleAmount - (individualRewardAmount * tokensToSplitAcross);
  }

  // view functions for redeem amounts, loops duplicated for gas
  function redeemable() public view returns (uint256) {
    uint256 toRedeem;
    uint256 maxRewardPoolSlot = totalSupply() / (MAX_BOTS / TOTAL_REWARD_POOLS);

    uint256 owned = balanceOf(msg.sender);
    for (uint256 i = 0; i < owned; i++) {
      uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
      uint256 rewardPoolSlotStartAt = tokenId / (MAX_BOTS / TOTAL_REWARD_POOLS);
      for (uint256 j = rewardPoolSlotStartAt; j < maxRewardPoolSlot; j++) {
        if (redeemed[tokenId][j]) {
          continue;
        }
        toRedeem += rewardPools[j];
      }
    }
    return toRedeem;
  }

  function totalRewards() public view returns (uint256) {
    uint256 toRedeem;

    uint256 owned = balanceOf(msg.sender);
    for (uint256 i = 0; i < owned; i++) {
      uint256 tokenId = tokenOfOwnerByIndex(msg.sender, i);
      uint256 rewardPoolSlotStartAt = tokenId / (MAX_BOTS / TOTAL_REWARD_POOLS);
      for (uint256 j = rewardPoolSlotStartAt; j < TOTAL_REWARD_POOLS; j++) {
        if (redeemed[tokenId][j]) {
          continue;
        }
        toRedeem += rewardPools[j];
      }
    }
    return toRedeem;
  }

  // timing related functions

  function _checkAndHandleNewAuction(uint256 nextTokenId) private {
    uint256 calculatedRewardPool = nextTokenId / (MAX_BOTS / TOTAL_REWARD_POOLS);
    if (_currentRewardPool != calculatedRewardPool) {
      _currentRewardPool = calculatedRewardPool;
      _auctionStartedAt = block.timestamp;
    }
  }

  function _secondsSinceAuctionStart() private view returns (uint256) {
    return (block.timestamp - _auctionStartedAt);
  }

  // etc

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_exists(tokenId), "URI query for nonexistent token");
    return _render(tokenId);
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}