// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./Collection.sol";

contract Main is Ownable {

  int private count;
  mapping(int => Collection) private collections;

  constructor() Ownable(msg.sender) {
    count = 0;
  }

  function createCollection(string calldata name, uint256 cardCount) external onlyOwner returns (int) {
    collections[count++] = new Collection(name, "PKM", cardCount);
    return count-1;
  }

  function getCollection(int index) external view returns(Collection) {
    return collections[index];
  }
}
