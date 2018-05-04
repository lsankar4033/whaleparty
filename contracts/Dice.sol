pragma solidity ^0.4.4;

import "./oraclizeAPI.sol";

import "./Ownable.sol";
import "./SafeMath.sol";

contract Dice is usingOraclize, Ownable {
  using SafeMath for uint256;

  uint256 constant INVALID_ROLL = 0;

  // Depends on slider
  uint256 constant MIN_ROLL = 1;
  uint256 constant MAX_ROLL = 100;

  // TODO: Is this right?
  bytes32 constant DEFAULT_BYTES32 = "";

  struct GameData {
    address player;
    uint256 odds; // represents the roll under which all winning rolls must lie
    uint256 trueWager;
    uint256 roll; // only populated when game is complete
    uint256 maxProfit; // max profit calculated at roll time
    bool active;
  }

  // TODO: Un-public these things after I'm done debugging
  mapping(bytes32 => GameData) public _queryToGameData;
  mapping(address => bytes32) public _playerToCurrentQuery;

  // For display purposes only
  uint256 public completedGames = 0;

  event GameCompleted(
    address indexed _player,
    bytes32 indexed _qId,
    uint256 _roll
  );

  event GameSubmitted(
    address indexed _player,
    bytes32 indexed _qId,
    uint256 _odds,
    uint256 _trueWager
  );

  constructor() public {}

  ////////////////
  // ADMIN ACTIONS
  ////////////////

  function withdrawBalance() external onlyOwner {
    uint256 balance = address(this).balance;

    // No withdrawal necessary if <= 0 balance
    require(balance > 0);

    msg.sender.transfer(balance);
  }

  // TODO: Should this be access restricted?
  function addBalance() external payable {
  }

  ///////////////
  // USER ACTIONS
  ///////////////

  // NOTE: Currently 1% of contract balance. Can be tuned
  function getMaxProfit() public view returns(uint256) {
    return address(this).balance / 100;
  }

  function rollDice(uint256 odds) external payable {
    uint256 queryPrice = oraclize_getPrice("URL");

    // player's wager
    require(msg.value > queryPrice);
    uint256 wagerAfterQuery = msg.value - queryPrice;
    uint256 fee = _computeRollFee(wagerAfterQuery);
    uint256 trueWager = wagerAfterQuery - fee;

    // NOTE: Can probably simplify this to something static
    string memory queryStr = _getQueryStr(MIN_ROLL, MAX_ROLL);

    // TODO: When we need to encrypt random.org encryption key, this will need to become a 'nested' query
    bytes32 qId = oraclize_query("URL", queryStr);
    emit GameSubmitted(msg.sender, qId, odds, trueWager);

    _queryToGameData[qId] = GameData(
      msg.sender,
      odds,
      trueWager,
      INVALID_ROLL,
      getMaxProfit(),
      true
    );
    _playerToCurrentQuery[msg.sender] = qId;
  }

  // NOTE: 1%, can be modified!
  function _computeRollFee(uint256 wagerAfterQuery) private pure returns (uint256) {
    return SafeMath.div(wagerAfterQuery, 100);
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
    _playerToCurrentQuery[msg.sender] = DEFAULT_BYTES32;

    // game completed!
    completedGames.add(1);
    emit GameCompleted(_queryToGameData[qId].player, qId, roll);
  }

  function _calculatePayout(bytes32 qId, uint256 roll) internal view returns(uint256) {
    GameData memory game = _queryToGameData[qId];

    uint256 odds = game.odds;
    if (roll > odds) {
      return 0;
    } else {
      uint256 wager = game.trueWager;
      uint256 maxProfit = game.maxProfit;

      // payout = wager + winnings
      // winnings = (100 - x) / x
      uint256 invOdds = MAX_ROLL.sub(odds);
      uint256 winnings = invOdds.div(odds);
      uint256 defaultWinnings = wager.add(winnings);

      uint256 availableBalance = _getAvailableBalance() ;
      if (defaultWinnings > availableBalance) {
        // NOTE: Probably should be less than all of the available balance!
        return availableBalance;
      }

      else if (winnings > maxProfit) {
        return wager.add(maxProfit);
      }

      else {
        return defaultWinnings;
      }
    }
  }

  function _getAvailableBalance() internal returns(uint256) {
    return address(this).balance;
  }

  function _resultToRoll(string result) internal returns(uint256) {
    return parseInt(result);
  }

  function hasActiveRoll() external view returns(bool) {
    return _playerToCurrentQuery[msg.sender] != DEFAULT_BYTES32;
  }

  function cancelActiveRoll() external {
    bytes32 qId = _playerToCurrentQuery[msg.sender];

    // Must have an active roll
    require(qId != DEFAULT_BYTES32);

    // Sanity check that game has same player associated with it
    require(_queryToGameData[qId].player == msg.sender);

    // cancel role
    _queryToGameData[qId].active = false;
    _playerToCurrentQuery[msg.sender] = DEFAULT_BYTES32;

    uint256 refund = _queryToGameData[qId].trueWager;
    uint256 availableBalance = _getAvailableBalance();

    if (refund > availableBalance) {
      // NOTE: Probably should be less than all of the available balance!
      _queryToGameData[qId].player.transfer(availableBalance);
    } else {
      _queryToGameData[qId].player.transfer(refund);
    }
  }
}
