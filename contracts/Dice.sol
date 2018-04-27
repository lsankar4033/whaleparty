pragma solidity ^0.4.4;

import "./oraclize/oraclizeAPI.sol";

// Phase 1: rolls a fair 'dice' (defined by min/max) for a fee (necessary b/c oraclize has a fee associated with it)
// Phase 2: add betting + payouts
contract Dice is usingOraclize {

  // TODO: Perhaps add something to track if authenticity proof was invalid
  struct GameData {
    address player;
    uint256 min;
    uint256 max;
    uint256 roll;
  }

  mapping(bytes32 => GameData) _queryToGameData;
  mapping(address => bytes32) _playerToLastQuery;

  // TODO
  event RollFinished(
  );

  function Dice() {}

  function roll(uint256 min, uint256 max) external {

  }

  // TODO: The method called by Oraclize
  //function __callback(bytes32 _queryId, string _result, bytes _proof) external {
    //// note, should verify that proof doesn't fail
  //}


  function getLastRoll() external {

  }

}
