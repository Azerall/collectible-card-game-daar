// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./Collection.sol";

contract Main {

  int private count;
  mapping(string => Collection) private collections;

  mapping(address => bool) private superAdmins; // Liste des super admins autorisés à créer des collections et mint des cartes

  constructor(address[] memory _admins) {
    count = 0;
    for (uint i = 0; i < _admins.length; i++) {
      superAdmins[_admins[i]] = true;
    }
  }

  // Fonction pour créer une collection
  function createCollection(string calldata collectionId, string calldata name, uint256 cardCount) external {
    require(superAdmins[msg.sender], "N'est pas un super-admin");
    collections[collectionId] = new Collection(name, "PKM", cardCount);
    count++;
  }

  // Récupère les cartes d'un utilisateur pour une collection donnée
  function getUserCards(string calldata collectionId, address owner) external view returns(string[] memory, string[] memory, string[] memory) {
    return collections[collectionId].getCardsByOwner(owner);
  }

  // Fonction pour mint une carte dans une collection spécifique
  function mintCard(string calldata collectionId, address to, string calldata cardNumber, string calldata name, string calldata image) external {
    require(superAdmins[msg.sender], "N'est pas un super-admin");
    collections[collectionId].mintCard(to, cardNumber, name, image);
  }

  // Transfère une carte d'un propriétaire à un autre dans une collection
  function transferCard(string calldata collectionId, string calldata _cardNumber, address from, address to) external {
    require(superAdmins[msg.sender], "N'est pas un super-admin");
    Collection collection = collections[collectionId];
    collection.transferCard(from, to, _cardNumber);
  }

  // Fonction pour récupérer le propriétaire d'une carte dans une collection
  function getCardOwner(string calldata collectionId, string calldata cardNumber) external view returns (address) {
    return collections[collectionId].getCardOwner(cardNumber);
  }

  // Fonction pour récupérer le nombre de collections
  function getCount() external view returns (int) {
    return count;
  }

}
