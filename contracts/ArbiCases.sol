// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ArbiCases is ERC721Enumerable, ERC721Burnable, Ownable {
  event Mint(address indexed owner, uint256 indexed tokenId);

  string private _baseTokenURI = "https://arbibots.xyz/cases/";
  IERC721Enumerable private _botContract;

  uint256[] private _fireBots = [1525, 1530, 1535, 1540, 1545, 1550, 1555, 1560, 1565, 1570, 1575, 1580, 1585, 1590, 1595, 1600, 1605, 1610, 1615, 1620, 1625, 1630, 1635, 1640, 1645];
  uint256[] private _bloodBots = [1555, 1680, 1705, 1730, 1755];
  uint256[] private _cThruBots = [1775, 1777, 1779, 1781, 1783, 1801, 1803, 1805, 1807, 1809, 1825, 1827, 1829, 1831, 1833, 1851, 1853, 1855, 1857, 1859, 1875, 1877, 1879, 1881, 1883];

  constructor(address botContract) ERC721("ArbiCases", "CASE") {
    _botContract = IERC721Enumerable(botContract);
  }

  function redeem() public {
    uint256 ownedBots = _botContract.balanceOf(msg.sender);
    for (uint256 i = 0; i < ownedBots; i++) {
      uint256 botId = _botContract.tokenOfOwnerByIndex(msg.sender, i);
      if (redeemable(botId) && !_exists(botId)) {
        _safeMint(msg.sender, botId);
      }
    }
  }

  function redeemIndividual(uint256 botId) public {
    require(_botContract.ownerOf(botId) == msg.sender, 'Minter must be owner');
    require(redeemable(botId), 'BotId must be redeemable');
    _safeMint(msg.sender, botId);
  }

  function redeemable(uint256 botId) public view returns (bool) {
    if (
      (botId <= 499) || // Founders 
      (botId % 25 == 0) || // First mint of each batch
      (botId % 25 == 24) || // Last mint of each batch
      (botId >= 650 && botId <= 674) || // Devilbot Minion
      (botId == 666) || // Devilbot #666
      (botId == 777) || // 
      (botId >= 770 && botId <= 779) || // Lucky Bot
      (botId == 875 || botId == 880 || botId == 885 || botId == 890) || // FortuneBot Case
      (botId == 888) || // FortuneBot Case (Golden)
      (botId >= 900 && botId <= 904) || (botId >= 925 && botId <= 929) || (botId >= 950 && botId <= 954) || (botId >= 975 && botId <= 979) || // Galaxy Bot Case
      (botId == 999) || // Galaxy Bot Case (Golden) 
      (botId == 1000) || // Unibot 1000
      (botId >= 1100 && botId <= 1124) || // Wishbot
      (botId == 1111) || // Wishbot (Golden)
      (botId >= 1125 && botId <= 1129) || (botId >= 1150 && botId <= 1154) || (botId >= 1175 && botId <= 1179) || (botId >= 1200 && botId <= 1204) || (botId >= 1225 && botId <= 1129) || (botId >= 1250 && botId <= 1254) || // BotBot
      (botId == 1234) || // BotBot (Golden)
      (botId >= 1275 && botId <= 1279) || (botId >= 1300 && botId <= 1304) || (botId >= 1325 && botId <= 1329) || (botId >= 1350 && botId <= 1354) || (botId >= 1375 && botId <= 1379) || // OtakuBot
      (botId == 1337) || // LEETBot
      (botId >= 1400 && botId <= 1404) || (botId >= 1425 && botId <= 1429) || (botId >= 1450 && botId <= 1454) || (botId >= 1475 && botId <= 1479) || (botId >= 1500 && botId <= 1504) || // IceBot
      contains(_fireBots, botId) || // FireBot
      (botId == 1559) || // 1559 
      contains(_bloodBots, botId) || // BloodBot
      (botId == 1666) || // BlackGoldBot
      contains(_cThruBots, botId) || // C-THRUBot
      (botId >= 1975 && botId <= 1998) || // BoxBot
      (botId == 1999) // KingBoxBot
    ) {
      return true;
    }

    return false;
  }

  function contains(uint256[] memory array, uint256 member) private pure returns (bool) {
    for (uint256 i = 0; i < array.length; i++) {
      if (array[i] == member) {
        return true;
      }
    }
    return false;
  }

  function _baseURI() internal view virtual override returns (string memory) {
    return _baseTokenURI;
  }

  function setBaseURI(string memory baseURI) public onlyOwner {
    _baseTokenURI = baseURI;
  }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
    super._beforeTokenTransfer(from, to, tokenId);
  }

  function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}