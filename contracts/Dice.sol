pragma solidity ^0.4.4;

import "./oraclize/oraclizeAPI.sol";

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

  // TODO: re-insert when we add wagering OR just use PullPayment
  //mapping(address => uint256) _playerBalances;

  event RollCompleted(
    bytes32 indexed _qId,
    uint256 _roll
  );

  event RollSubmitted(
    address indexed _sender,
    bytes32 indexed _qId,
    uint256 _min,
    uint256 _max
  );

  constructor() {}

  function roll(uint256 min, uint256 max) external payable returns (bytes32) {
    // min >= max doesn't make sense for a roll!
    require(min < max);

    // Make sure INVALID_ROLL outside of the specified range
    require(INVALID_ROLL < min || INVALID_ROLL > max);

    uint256 queryPrice = oraclize_getPrice("URL");

    // Player must pay query fee
    require(msg.value > queryPrice);

    string memory queryStr = _getQueryStr(min, max);

    // TODO: When we need to encrypt random.org encryption key, this will need to become a 'nested' query
    bytes32 qId = oraclize_query("URL", queryStr);

    _queryToGameData[qId] = GameData(
      msg.sender,
      min,
      max,
      INVALID_ROLL
    );

    emit RollSubmitted(msg.sender, qId, min, max);

    return qId;
  }

  // NOTE: Doesn't use API key so that we don't have to do all the fancy encryption stuff.
  function _getQueryStr(uint256 min, uint256 max) internal returns(string) {
    return strConcat("https://www.random.org/integers/?num=", uint2str(min), "&max=", uint2str(max), "&col=1&base=10&format=plain&rnd=new");
  }

  function __callback(bytes32 qId, string result, bytes proof) public {
    // Must be called by oraclize
    require(msg.sender == oraclize_cbAddress());

    // TODO: Check authenticity proof

    // Update game
    uint256 roll = _resultToRoll(result);
    _queryToGameData[qId].roll = roll;

    // Update latest game for player
    _playerToLastValidQuery[_queryToGameData[qId].player] = qId;

    // Frontend should listen for this message!
    emit RollCompleted(qId, roll);
  }

  function _resultToRoll(string result) internal returns(uint256) {
    return parseInt(result);
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
    return _queryToGameData[qId].roll;
  }
}
