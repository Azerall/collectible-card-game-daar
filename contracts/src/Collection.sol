// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Collection is ERC721, Ownable {

  struct Card {
    string cardNumber;
    string name;
    string image;
  }

  string public collectionName;
  uint256 public cardCount;
  address public admin; // L'administrateur de la collection

  Card[] public cards;
  mapping (uint => address) public cardToOwner; // Mapping des Token IDs vers les adresses des propriétaires
  mapping (address => uint) ownerCardCount; // Mapping des adresses des propriétaires vers le nombre de cartes qu'ils possèdent
  mapping (string => address) public cardNumberToOwner; // Mapping des IDs des cartes vers les adresses des propriétaires

  constructor(string memory _name, string memory _symbol, uint256 _cardCount) ERC721(_name, _symbol) Ownable(msg.sender) {
    collectionName = _name;
    cardCount = _cardCount;
    admin = msg.sender; // Le créateur de la collection est l'administrateur
  }
  
  // Fonction pour récupérer les cartes d'un utilisateur
  function getCardsByOwner(address _owner) external view returns(string[] memory, string[] memory, string[] memory) {
    uint count = ownerCardCount[_owner];
    string[] memory cardNumbers = new string[](count);
    string[] memory cardNames = new string[](count);
    string[] memory cardImages = new string[](count);

    uint counter = 0;
    for (uint i = 0; i < cards.length; i++) {
        if (cardNumberToOwner[cards[i].cardNumber] == _owner) {
            cardNumbers[counter] = cards[i].cardNumber;
            cardNames[counter] = cards[i].name;
            cardImages[counter] = cards[i].image;
            counter++;
        }
    }
    return (cardNumbers, cardNames, cardImages);
  }

  // Fonction pour récupérer le propriétaire d'une carte
  function getCardOwner(string memory _cardNumber) external view returns(address) {
    return cardNumberToOwner[_cardNumber];
  }

  // Fonction pour minter une carte pour un utilisateur spécifique
  function mintCard(address _to, string memory _cardNumber, string memory _name, string memory _image) external {
      require(msg.sender == admin, "Seul l'admin de la collection peut mint les cartes");

      cards.push(Card(_cardNumber, _name, _image));
      uint id = cards.length - 1;
      cardToOwner[id] = _to;
      ownerCardCount[_to]++;
      cardNumberToOwner[_cardNumber] = _to;

      _safeMint(_to, id); // Mint le NFT pour l'utilisateur
  }

  // Transfert d'une carte de l'adresse _from vers l'adresse _to
  function transferCard(address _from, address _to, string memory _cardNumber) external {
      uint tokenId;
      for (uint i = 0; i < cards.length; i++) {
          if (keccak256(abi.encodePacked(cards[i].cardNumber)) == keccak256(abi.encodePacked(_cardNumber))) {
              tokenId = i;
              break;
          }
      }
      require(_from == ownerOf(tokenId));
      
      cardToOwner[tokenId] = _to;
      ownerCardCount[_from]--;
      ownerCardCount[_to]++;
      cardNumberToOwner[cards[tokenId].cardNumber] = _to;

      safeTransferFrom(_from, _to, tokenId); // Transfère le NFT de l'ancien propriétaire au nouveau
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
