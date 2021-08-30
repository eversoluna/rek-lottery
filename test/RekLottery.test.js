const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Lottery Contract", function () {
    let RekLottery;
    let lottery;
    let owner;
    let player1;
    let player2;
    let player3;
    let ticketPrice = ethers.utils.parseEther("0.1"); // 0.1 ETH ticket price
    let housePercentage = 10; // 10% to the house
    let maxWinners = 3; // Number of winners
    let keyHash = "0x123456789abcdef"; // Dummy key hash for testing
    let fee = ethers.utils.parseUnits("0.1", "ether"); // Fee for Chainlink VRF

    beforeEach(async function () {
        // Deploy the contract before each test
        [owner, player1, player2, player3] = await ethers.getSigners();
        RekLottery = await ethers.getContractFactory("RekLottery");
        lottery = await RekLottery.deploy(
            ticketPrice,
            housePercentage,
            maxWinners,
            "0xabc", // VRF coordinator address (use mock for testing)
            "0xdef", // Link token address (use mock for testing)
            keyHash,
            fee
        );
    });

    it("should deploy the contract with correct values", async function () {
        // Check initial contract values
        expect(await lottery.ticketPrice()).to.equal(ticketPrice);
        expect(await lottery.housePercentage()).to.equal(housePercentage);
        expect(await lottery.maxWinners()).to.equal(maxWinners);
    });

    it("should allow players to enter the lottery", async function () {
        await lottery.connect(player1).enterLottery({ value: ticketPrice });
        await lottery.connect(player2).enterLottery({ value: ticketPrice });

        const players = await lottery.getPlayers();
        expect(players.length).to.equal(2);
        expect(players[0]).to.equal(player1.address);
        expect(players[1]).to.equal(player2.address);
    });

    it("should not allow entering with incorrect ticket price", async function () {
        await expect(
            lottery.connect(player1).enterLottery({ value: ethers.utils.parseEther("0.05") })
        ).to.be.revertedWith("Incorrect ticket price");
    });

    it("should select winners correctly after the lottery ends", async function () {
        // Players enter the lottery
        await lottery.connect(player1).enterLottery({ value: ticketPrice });
        await lottery.connect(player2).enterLottery({ value: ticketPrice });
        await lottery.connect(player3).enterLottery({ value: ticketPrice });

        // Fast-forward time to allow lottery to end
        await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
        await ethers.provider.send("evm_mine", []);

        // Mock Chainlink VRF randomness response
        const tx = await lottery.selectWinners();
        await expect(tx).to.emit(lottery, "LotteryEnded");

        const players = await lottery.getPlayers();
        expect(players.length).to.equal(0); // Players array should be reset
    });

    it("should handle multiple winners correctly", async function () {
        // Players enter the lottery
        await lottery.connect(player1).enterLottery({ value: ticketPrice });
        await lottery.connect(player2).enterLottery({ value: ticketPrice });
        await lottery.connect(player3).enterLottery({ value: ticketPrice });

        // Fast-forward time to allow lottery to end
        await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
        await ethers.provider.send("evm_mine", []);

        // Mock Chainlink VRF randomness response
        const tx = await lottery.selectWinners();
        await expect(tx).to.emit(lottery, "LotteryEnded");

        const players = await lottery.getPlayers();
        expect(players.length).to.equal(0); // Should reset after winners are selected
    });

    it("should send the correct house percentage to the owner", async function () {
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

        await lottery.connect(player1).enterLottery({ value: ticketPrice });
        await lottery.connect(player2).enterLottery({ value: ticketPrice });
        await lottery.connect(player3).enterLottery({ value: ticketPrice });

        // Fast-forward time to allow lottery to end
        await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
        await ethers.provider.send("evm_mine", []);

        const tx = await lottery.selectWinners();
        const receipt = await tx.wait();

        const totalPrize = ethers.utils.parseEther("0.3"); // 0.3 ETH in total
        const houseShare = totalPrize.mul(housePercentage).div(100); // 10% of 0.3 ETH

        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance.sub(initialOwnerBalance)).to.equal(houseShare);
    });

    it("should reset the lottery after winner selection", async function () {
        await lottery.connect(player1).enterLottery({ value: ticketPrice });
        await lottery.connect(player2).enterLottery({ value: ticketPrice });

        // Fast-forward time to allow lottery to end
        await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
        await ethers.provider.send("evm_mine", []);

        await lottery.selectWinners();
        
        // Check that players array is reset
        const players = await lottery.getPlayers();
        expect(players.length).to.equal(0);
    });

    it("should not allow winner selection before lottery ends", async function () {
        await lottery.connect(player1).enterLottery({ value: ticketPrice });
        await lottery.connect(player2).enterLottery({ value: ticketPrice });

        await expect(lottery.selectWinners()).to.be.revertedWith("Lottery is still active");
    });

    it("should allow the owner to change ticket price", async function () {
        await lottery.setTicketPrice(ethers.utils.parseEther("0.2"));
        expect(await lottery.ticketPrice()).to.equal(ethers.utils.parseEther("0.2"));
    });

    it("should allow the owner to change house percentage", async function () {
        await lottery.setHousePercentage(20);
        expect(await lottery.housePercentage()).to.equal(20);
    });

    it("should allow the owner to change max winners", async function () {
        await lottery.setMaxWinners(5);
        expect(await lottery.maxWinners()).to.equal(5);
    });

    it("should allow the owner to withdraw funds", async function () {
        const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

        await lottery.connect(player1).enterLottery({ value: ticketPrice });
        await lottery.connect(player2).enterLottery({ value: ticketPrice });

        // Fast-forward time to allow lottery to end
        await ethers.provider.send("evm_increaseTime", [86400]); // 1 day
        await ethers.provider.send("evm_mine", []);

        await lottery.selectWinners();

        const tx = await lottery.withdrawFunds();
        const receipt = await tx.wait();

        const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
        expect(finalOwnerBalance.gt(initialOwnerBalance)).to.be.true;
    });
});
