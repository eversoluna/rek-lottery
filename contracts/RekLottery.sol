// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";

contract RekLottery is Ownable, ReentrancyGuard, VRFConsumerBase {
    using SafeMath for uint256;

    address[] public players;
    uint256 public ticketPrice;
    uint256 public lotteryId;
    uint256 public lotteryEndTime;
    uint256 public housePercentage;  // Percentage of prize going to the house (owner)
    uint256 public maxWinners;
    bytes32 internal keyHash;
    uint256 internal fee;
    uint256 public randomResult;

    event LotteryEnded(address[] winners, uint256 prizeAmount, uint256 lotteryId);
    event NewPlayer(address player, uint256 lotteryId);

    modifier lotteryActive() {
        require(block.timestamp < lotteryEndTime, "Lottery has ended");
        _;
    }

    constructor(
        uint256 _ticketPrice,
        uint256 _housePercentage,
        uint256 _maxWinners,
        address vrfCoordinator,
        address linkToken,
        bytes32 _keyHash,
        uint256 _fee
    )
        VRFConsumerBase(vrfCoordinator, linkToken)
    {
        ticketPrice = _ticketPrice;
        housePercentage = _housePercentage;
        maxWinners = _maxWinners;
        lotteryId = 1;
        lotteryEndTime = block.timestamp + 1 days; // Lottery lasts for 1 day
        keyHash = _keyHash;
        fee = _fee;
    }

    function enterLottery() external payable lotteryActive nonReentrant {
        require(msg.value == ticketPrice, "Incorrect ticket price");
        players.push(msg.sender);
        emit NewPlayer(msg.sender, lotteryId);
    }

    function selectWinners() external onlyOwner nonReentrant {
        require(block.timestamp >= lotteryEndTime, "Lottery is still active");
        require(players.length > 0, "No players entered the lottery");

        // Request randomness from Chainlink VRF
        requestRandomness(keyHash, fee);
    }

    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        randomResult = randomness;

        // Determine winners based on the random number
        address[] memory winners = new address[](maxWinners);
        uint256 totalPrize = address(this).balance;
        uint256 houseShare = totalPrize.mul(housePercentage).div(100);
        uint256 prizePerWinner = (totalPrize.sub(houseShare)).div(maxWinners);

        for (uint256 i = 0; i < maxWinners; i++) {
            uint256 winnerIndex = uint256(keccak256(abi.encodePacked(randomResult, i))) % players.length;
            winners[i] = players[winnerIndex];
            payable(winners[i]).transfer(prizePerWinner);
        }

        // Send house cut to the owner
        payable(owner()).transfer(houseShare);

        emit LotteryEnded(winners, totalPrize, lotteryId);

        // Reset for the next round
        players = new address[](0);
        lotteryId++;
        lotteryEndTime = block.timestamp + 1 days;
    }

    // Getter function for players
    function getPlayers() external view returns (address[] memory) {
        return players;
    }

    // Function to change ticket price (only by owner)
    function setTicketPrice(uint256 _ticketPrice) external onlyOwner {
        ticketPrice = _ticketPrice;
    }

    // Function to change house percentage (only by owner)
    function setHousePercentage(uint256 _housePercentage) external onlyOwner {
        housePercentage = _housePercentage;
    }

    // Function to change max winners (only by owner)
    function setMaxWinners(uint256 _maxWinners) external onlyOwner {
        maxWinners = _maxWinners;
    }

    // Function to withdraw funds (only by owner)
    function withdrawFunds() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
