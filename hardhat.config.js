require("@nomiclabs/hardhat-ethers");
require("@chainlink/contracts/truffle/VRFConsumerBase");

module.exports = {
  solidity: "0.8.0",
  networks: {
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/" + process.env.INFURA_PROJECT_ID,
      accounts: process.env.PRIVATE_KEY
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
