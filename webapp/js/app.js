function ethToWei(eth) {
  return Math.floor(eth * (10**18));
}

function weiToEth(wei) {
  return wei / (10 ** 18);
}

App = {
  web3Provider: null,
  diceContract: null,

  maxProfitWei: 0,

  init: async () => {
    await App.initContracts();
    await App.initPage();

    // TODO: Set up Eth event listeners

    App.setupRollUI();

    $("#roll-btn").click(App.roll);

    $("#cancel-btn").click(App.cancelRoll);

    $('#roll-again').click(function(){
      $(".place-bet").fadeIn();
      $(".Analysis").fadeIn();
      $("#second-roll-under").fadeOut();
      $(".fade2").fadeOut();
      $(".result").fadeOut();
    });
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

  // TODO: Display num completed games?
  initPage: async () => {
    App.maxProfitWei = await App.diceContract.getMaxProfit();
    let hasActiveRoll = await App.diceContract.hasActiveRoll();

    if (!hasActiveRoll) {
      // Display roll prompt
      $('#roll-ongoing').fadeOut( () => $('#roll-ongoing').hide() );
      $('#roll-prompt').show();
    } else {
      $('#roll-ongoing-content').show();
    }
  },

  roll: async (min, max) => {
    // Display roll ongoing
    $('#roll-prompt').hide();
    $('#roll-ongoing').show();
    $('#roll-ongoing-content').show();

    $('#loading').fadeIn();

    // Submit roll to contract
    let odds = parseInt($('#x').val());
    let wager = ethToWei(parseFloat($('#wager').text()));
    await App.diceContract.rollDice(odds, {value: wager});

    // TODO: Add modal with tx info

    // TODO: Add back in winning element when we get appropriate GameCompleted event
    //$("#x2").text($('#x').val());
    //$("#x2").css("color","black");
    //$("#second-roll-under").fadeIn();
    //$("#winningnumber").css("display","none");
    //setTimeout(function(){
      //$("#loading").css("display","none");
      //var s = document.getElementById("winningnumber");
      //s.value = $('#rangeInput').val()*1+0;
      //$("#winningnumber").text($('#rangeInput').val()*1+0);

      //if ($("#winningnumber").val() <= $('#rangeInput').val()) {
        //$("#winningnumber").css("color","green");
        //$("#win").css("display","block");

      //} else {
        //$("#winningnumber").css("color","red");
        //$("#lose").css("display","block");
      //}
      //$(".fade2").fadeIn();
      //// $(".place-bet").fadeIn();
      //// $(".Analysis").fadeIn();
    //}, 3000)
  },

  cancelRoll: async () => {
    await App.diceContract.cancelActiveRoll();

    // TODO: Add modal with tx info
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
  $(window).load( () => {
    App.init();
  });
});
