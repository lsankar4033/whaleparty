pragma solidity ^0.4.4;

import "./oraclize/oraclizeAPI.sol";

// Phase 1: rolls a fair 'dice' (defined by min/max) for a fee (necessary b/c oraclize has a fee associated with it)
contract Dice is usingOraclize {

  function Dice() {}

  function roll(uint256 min, uint256 max) external returns (uint256) {

  }

}
