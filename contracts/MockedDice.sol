pragma solidity ^0.4.4;

// Dead simple for iterating on UI
contract MockedDice  {

  uint256 _nextQId = 0;

  mapping(bytes32 => uint256) _queryToRoll;
  mapping(address => uint256) _playerToLastRoll;

  // NOTE: Always returns min + 1 :P
  function roll(uint256 min, uint256 max) external payable returns (bytes32) {
    require(max > min + 1);

    _queryToRoll[bytes32(_nextQId)] = min + 1;
    _playerToLastRoll[msg.sender] = min + 1;

    _nextQId++;

    return bytes32(_nextQId);
  }

  function getLastRoll() external returns(uint256) {
    return _playerToLastRoll[msg.sender];
  }

  function getRoll(bytes32 qId) external returns(uint256) {
    return _queryToRoll[qId];
  }
}
