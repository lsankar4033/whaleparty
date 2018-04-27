pragma solidity ^0.4.4;

import "./oraclize/oraclizeAPI.sol";

// TODO: Figure out how to mock out oracle for local testing... Perhaps using ethereum-bridge?
// Phase 1: rolls a fair 'dice' (defined by min/max) for a fee (necessary b/c oraclize has a fee associated with it)
// Phase 2: add betting + payouts
contract Dice is usingOraclize {

  uint256 constant INVALID_ROLL = 0;

  // TODO: Perhaps add something to track if authenticity proof was invalid
  struct GameData {
    address player;
    uint256 min;
    uint256 max;
    uint256 roll;
  }

  mapping(bytes32 => GameData) _queryToGameData;
  mapping(address => bytes32) _playerToLastValidGame;

  // TODO: re-insert when we add wagering
  //mapping(address => uint256) _playerBalances;

  function Dice() {}

  function roll(uint256 min, uint256 max) external payable {
    // min >= max doesn't make sense for a roll!
    require(min < max);

    // Make sure INVALID_ROLL outside of the specified range
    require(INVALID_ROLL < min || INVALID_ROLL > max);

    uint256 queryPrice = oraclize_getPrice("URL")

    // Player must pay query fee
    require(msg.value > queryPrice);

    string memory queryStr = _getQueryStr(min, max);
    bytes32 qID = oraclize_query("URL", queryStr);

    _queryToGameData[qID] = GameData(
      msg.sender,
      min,
      max,
      INVALID_ROLL
    )
  }

  // TODO: Make this return the proper query string!
  function _getQueryStr(uint256 min, uint256 max) internal pure returns(string) {
    // TODO: Include min/max in query
    // TODO: Do we want to send a random query ID along?
    // NOTE: Mostly copied from Etheroll. validate this a bit more tightly...
    string memory queryStr = "'json(https://api.random.org/json-rpc/1/invoke).result.random[\"serialNumber\",\"data\"]', '\\n{\"jsonrpc\":\"2.0\",\"method\":\"generateSignedIntegers\",\"params\":{\"apiKey\":${[decrypt] BJ8BMENGnafmVci9OE5n98MGZRU624r/QWOQi90YwuZzHL2jaK2SCf5L38gsyD3kG4CS3sjZVLPdprfbo+L9lUXQtVJb/8SPIjkMU3lk943v60Co2+oLMVgSRtNKAAzHS6DJPeLOYaDHLhbCLORoUt2fPKSp87E=},\"n\":1,\"min\":1,\"max\":100,\"replacement\":true,\"base\":10${[identity] \"}\"},\"id\":";

    return "";
  }

  // TODO: The method called by Oraclize. Make sure to validate that only oraclize address calls this
  function __callback(bytes32 _queryId, string _result, bytes _proof) public {
    // note, should verify that proof doesn't fail

    // TODO: Fill this out!

  }


  // Maybe also return min/max
  function getLastRoll() external (uint256) {
    bytes32 qID = _playerToLastValidGame[msg.sender];

    // Is this the right check?
    if (qID == "") {
      return INVALID_ROLL;
    } else {
      GameData memory data = _queryToGameData[qID];

      return data.roll
    }
  }
}
