// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Booster is ERC721, Ownable {

    struct Card {
        string id;
        string name;
        string image;
    }

    string public boosterName;
    string public collectionId;
    uint256 public cardCount;
    bool public hasBeenOpened;

    constructor(string memory _name,
                string memory _symbol, 
                uint256 _boosterId, 
                string memory _collectionId,
                uint256 _cardCount,
                address owner) ERC721(_name, _symbol) Ownable(owner) {
        boosterName = _name;
        collectionId = _collectionId;
        cardCount = _cardCount;
        _mint(msg.sender, _boosterId);
    }

    function openBooster() external {
        require(!hasBeenOpened);
        hasBeenOpened = true;
    }

}