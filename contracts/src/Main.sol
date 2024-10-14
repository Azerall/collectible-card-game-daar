// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./Collection.sol";

contract Main is Ownable {

  using SafeMath for uint256;

  uint private count;
  mapping(int => Collection) private collections;

  constructor() {
    count = 0;
  }

  function createCollection(string calldata name, int cardCount) external returns (uint) onlyOwner {
    collections[count] = new Collection(name, cardCount);
    count = count.add(1);
    return count-1;
  }

  function getCollection(int index) external view returns(Collection) {
    return collections[index];
  }

  function addCardToCollection(int index, uint256 cardNumber, string calldata name, string calldata image) external onlyOwner {
    collections[index].createCard(cardNumber, name, image);
  }
}
