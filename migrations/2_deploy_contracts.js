var MockedDice = artifacts.require("./MockedDice.sol");

module.exports = function(deployer, network) {

  // TODO: Do non-dev deploys
  if (network == "development") {
    deployer.deploy(MockedDice);
  }
}
