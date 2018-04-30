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
  mapping(address => bytes32) _playerToLastValidQuery;

  // TODO: re-insert when we add wagering
  //mapping(address => uint256) _playerBalances;

  event RollCompleted(
    bytes32 indexed _qId,
    uint256 _roll
  );

  function Dice() {}

  function roll(uint256 min, uint256 max) external payable returns (bytes32) {
    // min >= max doesn't make sense for a roll!
    require(min < max);

    // Make sure INVALID_ROLL outside of the specified range
    require(INVALID_ROLL < min || INVALID_ROLL > max);

    uint256 queryPrice = oraclize_getPrice("URL");

    // Player must pay query fee
    require(msg.value > queryPrice);

    string memory queryStr = _getQueryStr(min, max);

    // TODO: When we need to encrypto random.org encryption key, this will need to become a 'nested' query
    bytes32 qId = oraclize_query("URL", queryStr);

    _queryToGameData[qId] = GameData(
      msg.sender,
      min,
      max,
      INVALID_ROLL
    );

    return qId;
  }

  // NOTE: Doesn't use API key so that we don't have to do all the fancy encryption stuff.
  function _getQueryStr(uint256 min, uint256 max) internal pure returns(string) {
    return strConcat("https://www.random.org/integers/?num=", uint2str(min), "&max=", uint2str(max), "&col=1&base=10&format=plain&rnd=new")
  }

  function __callback(bytes32 qId, string result, bytes proof) public {
    // Must be called by oraclize
    require(msg.sender == oraclize_cbAddress());

    // TODO: Check authenticity proof!

    // Update game
    uint256 roll = _resultToRoll(result);
    _queryToGameData[qId].roll = roll;

    // Update latest game for player
    _playerToLastValidQuery[_queryToGameData[qId].player] = qId;

    emit RollCompleted(qId, roll);
  }

  function _resultToRoll(string result) internal pure returns(uint256) {
    // TODO: Propertly extract once we've set up proper json endpoint!
    return str2uint(result);
  }

  function str2uint(string s) constant returns (uint256) {
    bytes memory b = bytes(s);
    uint result = 0;
    for (uint i = 0; i < b.length; i++) { // c = b[i] was not needed
      if (b[i] >= 48 && b[i] <= 57) {
        result = result * 10 + (uint(b[i]) - 48); // bytes and int are not compatible with the operator -.
      }
    }
    return result; // this was missing
  }

  // Maybe also return min/max
  function getLastRoll() external returns(uint256) {
    bytes32 qID = _playerToLastValidQuery[msg.sender];

    // Is this the right check?
    if (qID == "") {
      return INVALID_ROLL;
    } else {
      GameData memory data = _queryToGameData[qID];

      return data.roll;
    }
  }

  function getRoll(bytes32 qId) external returns(uint256) {
    // TODO
  }
}
