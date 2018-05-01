pragma solidity ^0.4.4;

import "./oraclize/oraclizeAPI.sol";

import "./zeppelin/SafeMath.sol";

contract Dice is usingOraclize {
  using SafeMath for uint256;

  // TODO: Remove once we start deleting old games from contract
  uint256 constant INVALID_ROLL = 0;

  // Depends on slider
  uint256 constant MIN_ROLL = 1;
  uint256 constant MAX_ROLL = 100;

  // TODO: Perhaps add something to track if authenticity proof was invalid
  struct GameData {
    address player;
    uint256 odds; // represents the roll under which all winning rolls must lie
    uint256 trueWager;
    uint256 roll; // only populated when game is complete
    bool active;
  }

  mapping(bytes32 => GameData) _queryToGameData;

  // For display purposes only
  uint256 public completedGames = 0;

  event GameCompleted(
    bytes32 indexed _qId,
    uint256 _roll
  );

  event RollSubmitted(
    address indexed _sender,
    bytes32 indexed _qId,
    uint256 _odds,
    uint256 _trueWager
  );

  constructor() public {}

  function roll(uint256 odds) external payable returns (bytes32) {
    uint256 queryPrice = oraclize_getPrice("URL");

    // TODO: Also subtract creator fee!
    // player's wager must cover query fee
    require(msg.value > queryPrice);
    uint256 trueWager = msg.value - queryPrice;

    // NOTE: Can probably simplify this to something static
    string memory queryStr = _getQueryStr(MIN_ROLL, MAX_ROLL);

    // TODO: When we need to encrypt random.org encryption key, this will need to become a 'nested' query
    bytes32 qId = oraclize_query("URL", queryStr);
    emit RollSubmitted(msg.sender, qId, odds, trueWager);

    _queryToGameData[qId] = GameData(
      msg.sender,
      odds,
      trueWager,
      INVALID_ROLL,
      true
    );

    return qId;
  }

  // NOTE: Doesn't use API key so that we don't have to do all the fancy encryption stuff.
  function _getQueryStr(uint256 min, uint256 max) internal returns(string) {
    return strConcat("https://www.random.org/integers/?num=", uint2str(min), "&max=", uint2str(max), "&col=1&base=10&format=plain&rnd=new");
  }

  function __callback(bytes32 qId, string result, bytes proof) public {
    // Must be called by oraclize
    require(msg.sender == oraclize_cbAddress());

    // Game must not have been cancelled or completed
    require(_queryToGameData[qId].active);

    // TODO: Check authenticity proof

    // Payout player
    uint256 roll = _resultToRoll(result);
    uint256 payout = _calculatePayout(qId, roll);
    if (payout > 0) {
      _queryToGameData[qId].player.transfer(payout);
    }

    // TODO: Delete game in the future to save space
    _queryToGameData[qId].roll = roll;
    _queryToGameData[qId].active = false;

    // game completed!
    completedGames.add(1);
    emit GameCompleted(qId, roll);
  }

  function _calculatePayout(bytes32 qId, uint256 roll) internal view returns(uint256) {
    uint256 odds = _queryToGameData[qId].odds;
    if (roll > odds) {
      return 0;
    } else {
      uint256 wager = _queryToGameData[qId].trueWager;

      // payout = wager + winnings
      // winnings = (100 - x) / x
      uint256 invOdds = MAX_ROLL.sub(odds);
      uint256 winnings = invOdds.div(odds);
      return wager.add(winnings);
    }
  }

  function _resultToRoll(string result) internal returns(uint256) {
    return parseInt(result);
  }

  function getRoll(bytes32 qId) public returns(uint256) {
    // Is this the right check?
    if (qId == "") {
      return INVALID_ROLL;
    } else {
      return _queryToGameData[qId].roll;
    }
  }

  function cancelRoll(bytes32 qId) public {
    GameData memory game = _queryToGameData[qId];

    // Canceller must be player
    require(game.player == msg.sender);

    // Must be an active game
    require(game.active);

    // Refund player
    game.player.transfer(game.trueWager);

    // TODO: Delete game in the future
    // Set game inactive
    _queryToGameData[qId].active = true;
  }
}
