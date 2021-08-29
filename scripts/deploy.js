// scripts/deploy.js
async function main() {
    // Fetch the signers
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Set contract constructor parameters
    const ticketPrice = ethers.utils.parseEther("0.1"); // 0.1 ETH ticket price
    const housePercentage = 10; // 10% of prize goes to the house
    const maxWinners = 3;
    const vrfCoordinator = process.env.VRF_COORDINATOR;
    const linkToken = process.env.LINK_TOKEN;
    const keyHash = process.env.CHAINLINK_KEY_HASH;
    const fee = process.env.CHAINLINK_FEE;

    // Log out the parameters to confirm they're being read correctly
    console.log(
      `Deploying contract with:
      Ticket Price: ${ticketPrice} ETH
      House Percentage: ${housePercentage}%
      Max Winners: ${maxWinners}
      VRF Coordinator: ${vrfCoordinator}
      LINK Token: ${linkToken}
      Key Hash: ${keyHash}
      Fee: ${fee}`
    );

    // Get the contract factory
    const Lottery = await ethers.getContractFactory("Lottery");

    // Deploy the contract with the specified parameters
    const lottery = await Lottery.deploy(
        ticketPrice,
        housePercentage,
        maxWinners,
        vrfCoordinator,
        linkToken,
        keyHash,
        fee
    );

    // Wait for the deployment to be mined
    await lottery.deployed();

    // Log the deployed contract address
    console.log("Lottery contract deployed to:", lottery.address);
}

// Execute the deployment script
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
