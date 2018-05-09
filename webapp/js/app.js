function ethToWei(eth) {
  return Math.floor(eth * (10**18));
}

function weiToEth(wei) {
  return wei / (10 ** 18);
}

// TODO: Determine this based on network?
const defaultGasPrice = 5000000000;

// NOTE: This function determines gas limit for a certain gas estimate
function gasLimit(gasEstimate) {
  return 2 * gasEstimate;
}

App = {
  web3Provider: null,
  diceContract: null,

  maxProfitWei: 0,

  init: async () => {
    await App.initContracts();
    await App.initPage();

    App.setupEventListeners();

    App.setupRollUI();

    $("#roll-btn").click(App.roll);
  },

  setupEventListeners: () => {
    let currentPlayer = web3.eth.accounts[0];

    // TODO: This should fill in the results table and last block
    let completed = App.diceContract.RollCompleted({player: currentPlayer}, {toBlock: 'latest'});
    completed.watch(App.completedHandler);
  },

  initContracts: async () => {
    if (typeof web3 == 'undefined') {
      alert("Couldn't find a web3 instance! Do you have metamask installed?");
    } else {
      App.web3Provider = web3.currentProvider;

      let contractData = await $.getJSON('contracts/Dice.json');

      let abstractContract = TruffleContract(contractData);
      abstractContract.setProvider(App.web3Provider);

      App.diceContract = await abstractContract.deployed();
    }
  },

  initPage: async () => {
    App.maxProfitWei = await App.diceContract.getMaxProfit();

    $('#roll-ongoing').hide();
    $('#roll-prompt').show();
  },

  roll: async (min, max) => {
    // Submit roll to contract
    let odds = parseInt($('#x').val());
    let wager = ethToWei(parseFloat($('#wager').text()));

    let gasEstimate = await App.diceContract.rollDice.estimateGas(odds, {value: wager});
    App.diceContract.rollDice(odds,
      {
        gas: gasLimit(gasEstimate),
        gasPrice: defaultGasPrice,
        value: wager
      });

    // Display roll ongoing
    $('#roll-prompt').hide();
    $('#roll-ongoing').show();
    $('#roll-ongoing-content').show();
    $('#loading').fadeIn();
  },

  // Handler for RollCompleted event from smart contract
  completedHandler: (err, result) => {
    if (!err) {
      let playerAddr = result.args.player;

      if (web3.eth.accounts[0] == playerAddr) {
        // TODO: Perhaps also display wager, odds, payout, etc.
        let wager = result.args.trueWager;
        let odds = result.args.odds;
        let roll = result.args.roll;
        let totalPayout = result.args.totalPayout;
        let profit = totalPayout - wager;

        $('#winningnumber').text(roll);

        // Change visual elements based on win or loss
        if (totalPayout > 0) {
          $("#winningnumber").css("color","green");
          $('#win').show();
        } else {
          $("#winningnumber").css("color","red");
          $('#lose').show();
        }

        $('#roll-prompt').hide();
        $('#roll-ongoing').hide();
        $('#roll-finished').show();
      } else {
        console.log(`Error waiting on cancel event: ${err}`);
      }
    }
  },

  // Sets up roll UI for selecting odds + bet size
  setupRollUI: () => {
    $('#rangeInput').on('input', function() {
      $("#x").text($('#rangeInput').val()*1+1);
      $("#chanceofwinning").text($('#rangeInput').val());
    });

    $('#betamount').on('input', function() {
      $('.wager').text($('#betamount').val());
      $('.winningpot').text((.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01).toFixed(8));
    });

    $('#min').click(function(){
      $('.wager').text(0.1);
      $('#betamount').val(0.1);
      $('.winningpot').text((.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01).toFixed(8));
    });

    $('#point5').click(function(){
      $('.wager').text(0.5);
      $('#betamount').val(0.5);
      $('.winningpot').text((.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01).toFixed(8));
    });

    $('#1').click(function(){
      $('.wager').text(1);
      $('#betamount').val(1);
      $('.winningpot').text((.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01).toFixed(8));
    });

    $('#max').click(function(){
      $('.wager').text(2);
      $('#betamount').val(2);
      $('.winningpot').text((.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01).toFixed(8));
    });

    $('#rangeInput').on('input', function() {
      $('.winningpot').text((.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01).toFixed(8)); //
    });
  }
};

$(function() {
  App.init();
});
