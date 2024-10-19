// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Collection is ERC721, Ownable {

  event NewCard(uint cardNumber, string name, string image);

  struct Card {
    uint256 cardNumber;
    string name;
    string image;
  }

  string public collectionName;
  uint256 public cardCount;
  address public admin;  // L'administrateur de la collection

  Card[] public cards;
  mapping (uint => address) public cardToOwner; // Mapping des Token IDs vers les adresses des propriétaires
  mapping (address => uint) ownerCardCount; // Mapping des adresses des propriétaires vers le nombre de cartes qu'ils possèdent

  constructor(string memory _name, string memory _symbol, uint256 _cardCount) ERC721(_name, _symbol) Ownable(msg.sender) {
    collectionName = _name;
    cardCount = _cardCount;
    admin = msg.sender; // Le créateur de la collection est l'administrateur
  }
  
  // Fonction pour récupérer les cartes d'un utilisateur
  function getCardsByOwner(address _owner) external view returns(uint[] memory) {
    uint[] memory result = new uint[](ownerCardCount[_owner]);
    uint counter = 0;
    for (uint i = 0; i < cards.length; i++) {
      if (cardToOwner[i] == _owner) {
        result[counter++] = i;
      }
    }
    return result;
  }

  // Fonction pour minter une carte pour un utilisateur spécifique
  function mintCard(address _to, uint256 _cardNumber, string memory _name, string memory _image) external {
      require(msg.sender == admin); // Seul l'administrateur peut mint une carte

      cards.push(Card(_cardNumber, _name, _image));
      uint id = cards.length - 1;
      cardToOwner[id] = _to;
      ownerCardCount[_to]++;

      _safeMint(_to, id); // Mint le NFT pour l'utilisateur
  }

  // Transfert d'une carte de l'adresse _from vers l'adresse _to
  function transferCard(address _from, address _to, uint256 _tokenId) external {
      require(_from == ownerOf(_tokenId));
      
      cardToOwner[_tokenId] = _to;
      ownerCardCount[_from]--;
      ownerCardCount[_to]++;

      safeTransferFrom(_from, _to, _tokenId); // Transfère le NFT de l'ancien propriétaire au nouveau
  }

  // Fonction pour récupérer le nombre de cartes d'un utilisateur
  function balanceOf(address _owner) public view override returns (uint256 _balance) {
    return ownerCardCount[_owner];
  }

  // Fonction pour récupérer le propriétaire d'une carte
  function ownerOf(uint256 _tokenId) public view override returns (address _owner) {
    return cardToOwner[_tokenId];
  }
}
