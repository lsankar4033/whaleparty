App = {
  web3Provider: null,
  diceContract: null,

  init: async () => {
    await App.initContracts();

    $('#test-roller').click( (e) => App.roll(1, 6) );
    $('#get-last-roll').click( App.getLastRoll );

    //
    $('#betamount').change($('.wager').text($('#betamount').val()));
    $('#betamount').change(function() {$('.wager').text($('#betamount').val())});
    $('#betamount').on('input', function() {
      $('.wager').text($('#betamount').val());
      $('.winningpot').text(.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01);
    });

    $('#min').click(function(){
      $('.wager').text(0.1);
      $('#betamount').val(.1);
      $('.winningpot').text(.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01);
    });

    $('#point5').click(function(){
      $('.wager').text(0.5);
      $('#betamount').val(0.5);
      $('.winningpot').text(.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01);
    });

    $('#1').click(function(){
      $('.wager').text(1);
      $('#betamount').val(1);
      $('.winningpot').text(.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01);
    });

    $('#max').click(function(){
      $('.wager').text(2);
      $('#betamount').val(2);
      $('.winningpot').text(.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01);
    });


    $('#rangeInput').on('input', function() {
      $('.winningpot').text(.99*(1-$('#rangeInput').val()/100)*$('#betamount').val()/($('#rangeInput').val()/100)-$('#betamount').val()*.01); //
    });


  }

  initContracts: async () => {
    if (typeof web3 == 'undefined') {
      alert("Couldn't find a web3 instance! Do you have metamask installed?");
    } else {
      App.web3Provider = web3.currentProvider;

      // TODO: Conditionally use 'actual' Dice.json
      let contractData = await $.getJSON('MockedDice.json');

      let abstractContract = TruffleContract(contractData);
      abstractContract.setProvider(App.web3Provider);

      App.diceContract = await abstractContract.deployed();
    }
  },

  roll: async (min, max) => {
    // NOTE: This will eventually be changed to be the wager
    let amountToPay = 0;
    await App.diceContract.roll(min, max, {value: amountToPay});
  },

  getLastRoll: async () => {
    let lastRoll = await App.diceContract.getLastRoll();
    alert(`Your last roll was: ${lastRoll.toNumber()}`);
  }

};

$(function() {
  $(window).load( () => {
    App.init();
  });
});
