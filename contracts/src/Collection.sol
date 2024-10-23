// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Collection is ERC721 {

  struct Card {
    string id;
    string name;
    string image;
  }

  string public collectionName;
  uint256 public cardCount;

  Card[] public cards;
  mapping (uint256 => address) public tokenToOwner; // Mapping des tokens vers les adresses des propriétaires
  mapping (address => uint) public ownerTokenCount; // Mapping des adresses des propriétaires vers le nombre de tokens qu'ils possèdent
 
  constructor(string memory _name, string memory _symbol, uint256 _cardCount) ERC721(_name, _symbol) {
    collectionName = _name;
    cardCount = _cardCount;
  }
  
  // Fonction pour récupérer les cartes d'un utilisateur
  function getCardsByOwner(address _owner) external view returns(string[] memory, string[] memory, string[] memory) {
    uint count = ownerTokenCount[_owner];
    string[] memory cardIds = new string[](count);
    string[] memory cardNames = new string[](count);
    string[] memory cardImages = new string[](count);

    uint counter = 0;
    for (uint i = 0; i < cards.length ; i++) {
        if (tokenToOwner[i] == _owner) {
            cardIds[counter] = cards[i].id;
            cardNames[counter] = cards[i].name;
            cardImages[counter] = cards[i].image;
            counter++;
        }
    }
    return (cardIds, cardNames, cardImages);
  }

  // Fonction pour minter une carte pour un utilisateur spécifique
  function mintCard(address _to, string memory _id, string memory _name, string memory _image) external {
      cards.push(Card(_id, _name, _image));
      uint tokenId = cards.length - 1;
      tokenToOwner[tokenId] = _to;
      ownerTokenCount[_to]++;

      _mint(_to, tokenId); // Mint le NFT pour l'utilisateur
  }

  // Transfert d'une minted carte de l'adresse _from vers l'adresse _to
  function transferCard(address _from, address _to, uint256 _tokenId) external {
      require(_from == tokenToOwner[_tokenId]);
      
      tokenToOwner[_tokenId] = _to;
      ownerTokenCount[_from]--;
      ownerTokenCount[_to]++;

      _transfer(_from, _to, _tokenId); // Transfert le NFT de l'utilisateur _from à l'utilisateur _to
  }

  // Fonction pour récupérer les propriétaires d'une carte
  function getCardOwners(string memory _id) external view returns (address[] memory) {
    address[] memory owners = new address[](cards.length);
    uint counter = 0;
    for (uint i = 0; i < cards.length; i++) {
        if (keccak256(abi.encodePacked(cards[i].id)) == keccak256(abi.encodePacked(_id))) {
            owners[counter] = tokenToOwner[i];
            counter++;
        }
    }
    return owners;
  }

  // Fonction pour récupérer le token d'une carte à partir de l'adresse du propriétaire et de l'ID de la carte
  function getCardToken(address owner, string memory _id) external view returns (int) {
    for (uint i = 0; i < cards.length; i++) {
        if (keccak256(abi.encodePacked(cards[i].id)) == keccak256(abi.encodePacked(_id)) && tokenToOwner[i] == owner) {
            return int(i);
        }
    }
    return -1;
  }

}
