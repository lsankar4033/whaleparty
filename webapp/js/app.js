App = {
  web3Provider: null,
  diceContract: null,

  init: async () => {
    //await App.initContracts();

    $('#test-roller').click( (e) => App.roll(1, 6) );
    $('#get-last-roll').click( App.getLastRoll );

    //

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

    $("#test-roller").on("click", function(){
      $(".place-bet").css("display","none");
      $(".Analysis").css("display","none");
      $("#loading").fadeIn()
      $("#x2").text($('#x').val());
      $("#x2").css("color","black");
      $("#second-roll-under").fadeIn();
      $("#winningnumber").css("display","none");
      setTimeout(function(){
      $("#loading").css("display","none");
      var s = document.getElementById("winningnumber");
      s.value = $('#rangeInput').val()*1+0;
      $("#winningnumber").text($('#rangeInput').val()*1+0);


      if ($("#winningnumber").val() <= $('#rangeInput').val()) {
        $("#winningnumber").css("color","green");
        $("#win").css("display","block");

      } else {
        $("#winningnumber").css("color","red");
        $("#lose").css("display","block");
      }
      $(".fade2").fadeIn();
      // $(".place-bet").fadeIn();
      // $(".Analysis").fadeIn();
    }, 3000)
    });


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

      let contractData = await $.getJSON('Dice.json');

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
