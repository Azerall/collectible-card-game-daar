// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Collection is ERC721, Ownable {

  struct Card {
    string id;
    string name;
    string image;
  }

  string public collectionName;
  uint256 public cardCount;

  address private _admin; // L'administrateur de la collection
  uint256 private _currentTokenId; // ID du dernier token minté

  Card[] public cards;
  mapping (string => uint) public cardIdToIndex; // Mapping des IDs des cartes vers les indices des cartes
  mapping (uint256 => uint256) public tokenToCard; // Mapping des Token IDs vers les indices des cartes
  mapping (uint256 => address) public tokenToOwner; // Mapping des Token IDs vers les adresses des propriétaires
  mapping (address => uint) public ownerTokenCount; // Mapping des adresses des propriétaires vers le nombre de minted cartes qu'ils possèdent
 
  constructor(string memory _name, string memory _symbol, uint256 _cardCount) ERC721(_name, _symbol) Ownable(msg.sender) {
    collectionName = _name;
    cardCount = _cardCount;
    _admin = msg.sender; // Le créateur de la collection est l'administrateur
    _currentTokenId = 0;
  }
  
  // Fonction pour récupérer les cartes d'un utilisateur
  function getCardsByOwner(address _owner) external view returns(string[] memory, string[] memory, string[] memory) {
    uint count = ownerTokenCount[_owner];
    string[] memory cardIds = new string[](count);
    string[] memory cardNames = new string[](count);
    string[] memory cardImages = new string[](count);

    uint counter = 0;
    for (uint i = 0; i < _currentTokenId; i++) {
        if (tokenToOwner[i] == _owner) {
            cardIds[counter] = cards[tokenToCard[i]].id;
            cardNames[counter] = cards[tokenToCard[i]].name;
            cardImages[counter] = cards[tokenToCard[i]].image;
            counter++;
        }
    }
    return (cardIds, cardNames, cardImages);
  }

  // Fonction pour minter une carte pour un utilisateur spécifique
  function mintCard(address _to, string memory _id, string memory _name, string memory _image) external {
      require(msg.sender == _admin, "Seul l'admin de la collection peut minter les cartes");

      if (cardIdToIndex[_id] == 0 && cards.length > 0) {
        require(cards.length < cardCount, "Nombre maximum de cartes atteint");
        cards.push(Card(_id, _name, _image));
        cardIdToIndex[_id] = cards.length - 1;
        tokenToCard[_currentTokenId] = cards.length - 1;
      } 

      tokenToCard[_currentTokenId] = cardIdToIndex[_id];
      tokenToOwner[_currentTokenId] = _to;
      ownerTokenCount[_to]++;

      _safeMint(_to, _currentTokenId); // Mint le NFT pour l'utilisateur

      _currentTokenId++;
  }

  // Transfert d'une minted carte de l'adresse _from vers l'adresse _to
  function transferCard(address _from, address _to, uint256 _tokenId) external {
      require(_from == ownerOf(_tokenId));
      
      tokenToOwner[_tokenId] = _to;
      ownerTokenCount[_from]--;
      ownerTokenCount[_to]++;

      safeTransferFrom(_from, _to, _tokenId); // Transfère le NFT de l'ancien propriétaire au nouveau
  }

  // Fonction pour récupérer le propriétaire d'une minted carte
  function ownerOf(uint256 _tokenId) public view override returns (address _owner) {
    return tokenToOwner[_tokenId];
  }

  // Fonction pour récupérer les propriétaires d'une carte
  function getCardOwners(string memory _id) external view returns (address[] memory) {
    address[] memory owners = new address[](_currentTokenId);
    uint counter = 0;
    for (uint i = 0; i < _currentTokenId; i++) {
        if (keccak256(abi.encodePacked(cards[tokenToCard[i]].id)) == keccak256(abi.encodePacked(_id))) {
            owners[counter] = tokenToOwner[i];
            counter++;
        }
    }
    return owners;
  }

  function getCardToken(address owner, string memory _id) external view returns (int) {
    for (uint i = 0; i < _currentTokenId; i++) {
        if (tokenToOwner[i] == owner && keccak256(abi.encodePacked(cards[tokenToCard[i]].id)) == keccak256(abi.encodePacked(_id))) {
            require(tokenToOwner[i] == owner);
            require(tokenToCard[i] == cardIdToIndex[_id]);
            return int(i);
        }
    }
    return -1;
  }
}
