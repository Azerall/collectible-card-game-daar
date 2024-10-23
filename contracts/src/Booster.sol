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
    Card[] public cards;
    uint256 public cardCount;
    bool public hasBeenOpened;

    constructor(uint256 _boosterId, 
                string memory _name,
                string memory _symbol, 
                string memory _collectionId,
                uint256 _cardCount, 
                string[] memory _cardIds, 
                string[] memory _cardNames, 
                string[] memory _cardImages,
                address owner) ERC721(_name, _symbol) Ownable(owner) {
        boosterName = _name;
        collectionId = _collectionId;
        cardCount = _cardCount;
        for (uint i = 0; i < _cardCount ; i++) {
            cards.push(Card(_cardIds[i], _cardNames[i], _cardImages[i]));
        }
        _mint(msg.sender, _boosterId);
    }

    function openBooster() external onlyOwner {
        require(!hasBeenOpened);
        hasBeenOpened = true;
    }

}