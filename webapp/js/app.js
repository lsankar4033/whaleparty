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
    App.initContracts( async () => {
      await App.setupEventListeners();
      await App.setupRollUI();

      $("#roll-btn").click(App.roll);

      // Make this last so we wait until the end to make page elements visible
      await App.initPage();
    });
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

  initContracts: (callback) => {
    if (typeof web3 == 'undefined') {
      alert("Couldn't find a web3 instance! Do you have metamask installed?");
    }

    web3.version.getNetwork( async (err, netId) => {
      // Wrong network. Checks that metamask points to mainnet or dev network
      if (web3.version.network != 1 && web3.version.network != 4 && web3.version.network != 5777) {
        console.log(`Detected network: ${netId}`);
        alert("You must point Metamask to mainnet or rinkeby to use Whale Party!");
      }

      else {
        App.web3Provider = web3.currentProvider;

        let contractData = await $.getJSON('contracts/Dice.json');

        let abstractContract = TruffleContract(contractData);
        abstractContract.setProvider(App.web3Provider);

        App.diceContract = await abstractContract.deployed();

        callback();
      }
    });
  },

  initPage: async () => {
    App.maxProfitWei = await App.diceContract.getMaxProfit();

    $('.resultboxwin').hide();
    $('.resultboxlose').hide();

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
    $('.resultboxwin').hide();
    $('.resultboxlose').hide();
    $('#roll-ongoing').fadeIn();
  },

  newRollCompletedHandler: (err, result) => {
    if (!err) {
      let {player, trueWager, wager, odds, roll, totalPayout} = result.args;

      let profit = totalPayout - wager;
      let formattedProfit = weiToEth(profit).toFixed(4);

      if ($('#roll-ongoing').is(':visible')) {
        $('#roll-ongoing').fadeOut(() => {

          if (formattedProfit > 0) {
            // alert("WIN");
            // alert(formattedProfit);
            // alert((formattedProfit > 0));
            $('.resultboxwin').show();
            $('#win-roll').text(roll);
          } else {
            // alert("lose");
            $('.resultboxlose').show();
            $('#lose-roll').text(roll);
          }

          $('#roll-prompt').show();
        });
      }
    } else {
      console.log(`Faulty completed event! err: ${err}`);
    }
  },

  allRollCompletedHandler: (err, result) => {
    if (!err) {
      let {player, wager, trueWager, odds, roll, totalPayout} = result.args;

      let profit = totalPayout - wager;
      let formattedProfit = weiToEth(profit).toFixed(4);

      var table = document.getElementById("myTable");
      var row = table.insertRow(1);
      var cell1 = row.insertCell(0);
      var cell2 = row.insertCell(1);
      var cell3 = row.insertCell(2);
      var cell4 = row.insertCell(3);
      cell1.innerHTML = weiToEth(wager).toFixed(4);
      cell2.innerHTML = odds.toFixed(0);
      cell3.innerHTML = roll.toFixed(0);
      cell4.innerHTML = formattedProfit < 0 ? formattedProfit : `+${formattedProfit}`;

    } else {
      console.log(`Faulty completed event! err: ${err}`);
    };
    $(function(){
    $('tr').each(function(){
      var col_val = +($(this).find("td:eq(3)").text());
      if (col_val > 0){
        $(this).addClass('won');  //the selected class colors the row green//
      } else {
        $(this).addClass('lost');
      }
    });
  });
  },

  // Sets up roll UI for selecting odds + bet size
  setupRollUI: () => {
    $('#rangeInput').on('input', function() {
      $("#x").text($('#rangeInput').val()*1+1);
      $("#chanceofwinning").text($('#rangeInput').val());
    });

    $('#betamount').on('input', function() {
      $('.wager').text($('#betamount').val());

      // var winning_amt = (.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01);
      var winning_amt = (.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100));
      var max_win_amt = weiToEth(App.maxProfitWei);
      if (max_win_amt < winning_amt){
        $('.winningpot').text((max_win_amt).toFixed(8));
        $('#maxwinreached').show();
      } else{
        $('.winningpot').text((winning_amt).toFixed(8));
      }
    });

    $('#min').click(function(){
      $('.wager').text(0.1);
      $('#betamount').val(0.1);
      var winning_amt = (.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100));
      var max_win_amt = weiToEth(App.maxProfitWei);
      if (max_win_amt < winning_amt){
        $('.winningpot').text((max_win_amt).toFixed(8));
        $('#maxwinreached').show();
      } else{
        $('.winningpot').text((winning_amt).toFixed(8));
        $('#maxwinreached').hide();
      }
    });

    $('#point5').click(function(){
      $('.wager').text(0.5);
      $('#betamount').val(0.5);
      var winning_amt = (.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100));
      var max_win_amt = weiToEth(App.maxProfitWei);
      if (max_win_amt < winning_amt){
        $('.winningpot').text((max_win_amt).toFixed(8));
        $('#maxwinreached').show();
      } else{
        $('.winningpot').text((winning_amt).toFixed(8));
        $('#maxwinreached').hide();
      }
    });

    // $('#1').click(function(){
    //   $('.wager').text(1);
    //   $('#betamount').val(1);
    //   var winning_amt = (.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01);
    //   var max_win_amt = weiToEth(App.maxProfitWei);
    //   if (max_win_amt < winning_amt){
    //     $('.winningpot').text((max_win_amt).toFixed(8));
    //     $('#maxwinreached').show();
    //   } else{n

    //     $('.winningpot').text((winning_amt).toFixed(8));
    //     $('#maxwinreached').hide();
    //   }
    // });
    //
    // $('#max').click(function(){
    //   $('.wager').text(2);
    //   $('#betamount').val(2);
    //   var winning_amt = (.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01);
    //   var max_win_amt = weiToEth(App.maxProfitWei);
    //   if (max_win_amt < winning_amt){
    //     $('.winningpot').text((max_win_amt).toFixed(8));
    //     $('#maxwinreached').show();
    //   } else{
    //     $('.winningpot').text((winning_amt).toFixed(8));
    //     $('#maxwinreached').hide();
    //   }
    // });

    $('#rangeInput').on('input', function() {
      // $('.winningpot').text((.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01).toFixed(8));
      var winning_amt = (.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100));
      var max_win_amt = weiToEth(App.maxProfitWei);
      if (max_win_amt < winning_amt){
        $('.winningpot').text((max_win_amt).toFixed(8));
        $('#maxwinreached').show();
      } else{
        $('.winningpot').text((winning_amt).toFixed(8));
        $('#maxwinreached').hide();
      }


       //
    });

    // Get the modal
    var modal = document.getElementById('myModal');

    // Get the button that opens the modal
    var btn = document.getElementById("btnsuccess");

    // Get the <span> element that closes the modal
    var span = document.getElementsByClassName("close")[0];

    // When the user clicks the button, open the modal
    btn.onclick = function() {
      modal.style.display = "block";
    }

    // When the user clicks on <span> (x), close the modal
    span.onclick = function() {
      modal.style.display = "none";
    }

    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
  }
};

$(function() {
  App.init();
});
