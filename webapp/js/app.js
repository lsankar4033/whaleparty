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

// NOTE: The necessity for this map is extremely unfortunate :/. It needs to be updated on every deploy
const networkToBlockNum = {
  4: 2255074
}

App = {
  web3Provider: null,
  diceContract: null,

  maxProfitWei: 0,

  init: async () => {
    await App.initContracts();
    await App.setupEventListeners();
    await App.setupRollUI();

    $("#roll-btn").click(App.roll);

    // Make this last so we wait until the end to make page elements visible
    await App.initPage();
  },

  setupEventListeners: () => {
    let currentPlayer = web3.eth.accounts[0];

    // Rolls completed since this listener was set up
    App.diceContract.RollCompleted(
      {player: currentPlayer},
      {toBlock: 'latest'},
      App.newRollCompletedHandler
    );

    // All rolls
    let contractBlockNum = networkToBlockNum[web3.version.network];

    if (typeof contractBlockNum != 'undefined') {
      App.diceContract.RollCompleted(
        {player: currentPlayer},
        {fromBlock: contractBlockNum, toBlock: 'latest'},
        App.allRollCompletedHandler
      );
    }
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

    $('#roll-ongoing').fadeOut(() => $('#roll-prompt').show());
  },

  roll: async (min, max) => {
    // Submit roll to contract
    let odds = parseInt($('#x').val());
    let wagerWei = ethToWei(parseFloat($('#wager').text()));

    let gasEstimate = await App.diceContract.rollDice.estimateGas(odds, {value: wagerWei});
    let txId = await App.diceContract.rollDice.sendTransaction(
      odds,
      {
        gas: gasLimit(gasEstimate),
        gasPrice: defaultGasPrice,
        value: wagerWei
      }
    );

    console.log(`Roll submitted! odds: ${odds}, wager: ${wagerWei} txId: ${txId}`);

    // Populate roll info
    $('#pending-roll-info').show();
    $('#pending-roll-info .wager').text(weiToEth(wagerWei));
    $('#pending-roll-info .odds').text(odds);

    // Display roll ongoing
    $('#roll-prompt').hide();
    $('#roll-ongoing').fadeIn();
  },

  newRollCompletedHandler: (err, result) => {
    if (!err) {
      let {player, trueWager, odds, roll, totalPayout} = result.args;

      console.log(`Received new completed event! wager: ${trueWager}, odds: ${odds}, roll: ${roll}, payout: ${totalPayout}`);

      // TODO: Populate latest roll element

      if ($('#roll-ongoing').is(':visible')) {
        $('#roll-ongoing').fadeOut(() => $('#roll-prompt').show());
      }
    } else {
      console.log(`Faulty completed event! err: ${err}`);
    }
  },

  allRollCompletedHandler: (err, result) => {
    if (!err) {
      let {player, trueWager, odds, roll, totalPayout} = result.args;

      console.log(`Logged completed event! wager: ${trueWager}, odds: ${odds}, roll: ${roll}, payout: ${totalPayout}`);
      // TODO: Populate results table
      var table = document.getElementById("myTable");
      var row = table.insertRow(1);
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);
      var cell4 = row.insertCell(3);
      var cell5 = row.insertCell(4);
      cell1.innerHTML = player;
      cell2.innerHTML = trueWager;
      cell3.innerHTML = odds;
      cell4.innerHTML = roll;
      cell5.innerHTML = totalPayout;

    } else {
      console.log(`Faulty completed event! err: ${err}`);
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
