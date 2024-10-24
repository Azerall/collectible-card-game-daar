// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./Collection.sol";
import "./Booster.sol";

import "hardhat/console.sol";

contract Main {

  int private count;
  mapping(string => Collection) private collections;

  mapping(address => bool) private superAdmins; // Liste des super admins autorisés à créer des collections et mint des cartes

  Booster[] public boosters;

  constructor(address[] memory _admins) {
    count = 0;
    for (uint i = 0; i < _admins.length; i++) {
      superAdmins[_admins[i]] = true;
    }
  }

  // Fonction pour créer une collection
  function createCollection(string calldata collectionId, string calldata name, uint256 cardCount) external {
    require(superAdmins[msg.sender], "Super-admin requis.");
    collections[collectionId] = new Collection(name, "PKM", cardCount);
    count++;
  }

  // Récupère les cartes d'un utilisateur pour une collection donnée
  function getUserCards(string calldata collectionId, address owner) external view returns(string[] memory, string[] memory, string[] memory) {
    return collections[collectionId].getCardsByOwner(owner);
  }

  // Fonction pour mint une carte dans une collection spécifique
  function mintCard(string calldata collectionId, address to, string calldata id, string calldata name, string calldata image) external {
    require(superAdmins[msg.sender], "Super-admin requis.");
    collections[collectionId].mintCard(to, id, name, image);
  }

  // Echange deux cartes entre deux propriétaires dans une collection
  function tradeCards(string calldata collectionId1, address owner1, uint tokenId1, string calldata collectionId2, address owner2, uint tokenId2) external {
    require(superAdmins[msg.sender], "Super-admin requis.");
    collections[collectionId1].transferCard(owner1, owner2, tokenId1);
    collections[collectionId2].transferCard(owner2, owner1, tokenId2);
  }

  // Approuve un opérateur pour tous les tokens du propriétaire
  function setApprovalForAll(string calldata collectionId, address operator, bool approved) external {
    require(superAdmins[msg.sender], "Super-admin requis.");
    collections[collectionId].setApprovalForAll(operator, approved);
  }

  // Fonction pour récupérer le propriétaire d'une carte dans une collection
  function getCardOwner(string calldata collectionId, uint tokenId) external view returns (address) {
    return collections[collectionId].ownerOf(tokenId);
  }

  // Fonction pour récupérer les propriétaires d'une carte dans une collection
  function getCardOwners(string calldata collectionId, string calldata id) external view returns (address[] memory) {
    return collections[collectionId].getCardOwners(id);
  }

  // Fonction pour récupérer le token d'une carte dans une collection
  function getCardToken(string calldata collectionId, address owner, string calldata id) external view returns (int) {
    return collections[collectionId].getCardToken(owner, id);
  }

  // Fonction pour créer un booster
  function createBooster(string calldata boosterName, string calldata collectionId, uint256 cardCount) external {
    uint256 boosterId = boosters.length;
    boosters.push(new Booster(boosterName, "PKM", boosterId, collectionId, cardCount, msg.sender));
  }

  // Fonction pour récupérer les boosters d'un utilisateur
  function getBoostersOfOwner() external view returns (string[] memory, bool[] memory) {
    string[] memory userBoostersName = new string[](boosters.length);
    bool[] memory userOpened = new bool[](boosters.length);
    uint counter = 0;
    for (uint i = 0; i < boosters.length; i++) {
      if (boosters[i].owner() == msg.sender) {
        userBoostersName[counter] = boosters[i].boosterName();
        userOpened[counter] = boosters[i].hasBeenOpened();
        counter++;
      }
    }
    return (userBoostersName, userOpened);
  }

  // Fonction pour ouvrir un booster
  function openBooster(uint boosterId, string[] calldata cardIds, string[] calldata cardNames, string[] calldata cardImages) external returns (bool) {
    Booster booster = boosters[boosterId];
    booster.openBooster();
    Collection collection = collections[booster.collectionId()];
    for (uint256 i = 0; i < booster.cardCount(); i++) {
      (string memory id, string memory name, string memory image) = (cardIds[i], cardNames[i], cardImages[i]);
      collection.mintCard(booster.owner(), id, name, image);
    }
    return true;
  }
}
