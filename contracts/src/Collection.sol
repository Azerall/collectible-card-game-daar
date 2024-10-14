// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

import "./ownable.sol";
import "./safemath.sol";

contract Collection is ERC721 {

  using SafeMath for uint256;
  using SafeMath16 for uint16;

  event NewCard(uint cardNumber, string name, string image);

  struct Card {
    uint256 cardNumber;
    string name;
    string image;
  }

  string public name;
  uint16 public cardCount;
  Card[] public cards;

  mapping (uint => address) public cardToOwner;
  mapping (address => uint) ownerCardCount;

  mapping (uint => address) cardApprovals;

  function createCard(uint256 _cardNumber, string _name, string _image) public {
    require(cards.length < cardCount);
    uint id = cards.push(Card(_cardNumber, _name, _image)) - 1;
    //cardToOwner[id] = msg.sender;
    //ownerCardCount[msg.sender] = ownerCardCount[msg.sender].add(1);
    NewCard(_cardNumber, _name, _image);
  }

  constructor(string memory _name, int _cardCount) {
    name = _name;
    cardCount = _cardCount;
  }
  
  function getCardsByOwner(address _owner) external view returns(uint[]) {
    uint[] memory result = new uint[](ownerCardCount[_owner]);
    uint counter = 0;
    for (uint i = 0; i < cards.length; i++) {
      if (cardToOwner[i] == _owner) {
        result[counter] = i;
        counter = counter.add(1);
      }
    }
    return result;
  }

  function balanceOf(address _owner) public view returns (uint256 _balance) {
    return ownerCardCount[_owner];
  }

  function ownerOf(uint256 _tokenId) public view returns (address _owner) {
    return cardToOwner[_tokenId];
  }

  function _transfer(address _from, address _to, uint256 _tokenId) private {
    ownerCardCount[_to] = ownerCardCount[_to].add(1);
    ownerCardCount[msg.sender] = ownerCardCount[msg.sender].sub(1);
    cardToOwner[_tokenId] = _to;
    Transfer(_from, _to, _tokenId);
  }

  function transfer(address _to, uint256 _tokenId) public onlyOwnerOf(_tokenId) {
    _transfer(msg.sender, _to, _tokenId);
  }

  function approve(address _to, uint256 _tokenId) public onlyOwnerOf(_tokenId) {
    cardApprovals[_tokenId] = _to;
    Approval(msg.sender, _to, _tokenId);
  }

  function takeOwnership(uint256 _tokenId) public {
    require(cardApprovals[_tokenId] == msg.sender);
    address owner = ownerOf(_tokenId);
    _transfer(owner, msg.sender, _tokenId);
  }
}
