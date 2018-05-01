Betting game on Ethereum using Oraclize+random.org for trusted randomness

# Approaches

Two common approaches for trusted randomness are:
1. hash chain, like bustabit
2. trusted random data source, like random.org + oracle service, like oraclize

For our first iteration, we're going with 2 as it'll allow us to prototype something relatively rapidly. The
sooner we launch a game, the better :).

## Dice Game w/ oracle

Testing approaches here: https://docs.oraclize.it/#development-tools

random.org beta key: e8c764a8-6911-4578-84bb-44ac3e56524f
(DO NOT MAKE THIS PUBLIC AND ONLY KEEP ENCRYPTED VERSION IN CONTRACT!)

oraclize pubkey: 044992e9473b7d90ca54d2886c7addd14a61109af202f1c95e218b0c99eb060c7134c4ae46345d0383ac996185762f04997d6fd6c393c86e4325c469741e64eca9

See here for usage: http://docs.oraclize.it/#ethereum-advanced-topics-encrypted-queries

Does random.org require you to use an API key:
https://etherscan.io/address/0xd8a5b0d3cb3b00113a0cd96856926dc555d9e752#code ?

We could use https://www.random.org/integers/?num=100&min=1&max=100&col=5&base=10&format=html&rnd=new

## Roadmap

### Contract
- dice contract w/simple querying
- add wagers/payouts (don't need pullpayments b/c pay directly back to address)
- events to make UI responsive to callback
- check authenticity proof on callback
- contract with API-key random.org querying

### Frontend

