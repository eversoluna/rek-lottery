async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    const ticketPrice = ethers.utils.parseEther("0.1");
    const housePercentage = 10; // 10% to the house
    const maxWinners = 3;
    const keyHash = process.env.CHAINLINK_KEY_HASH;
    const vrfCoordinator = process.env.VRF_COORDINATOR;
    const linkToken = process.env.LINK_TOKEN;
    const fee = process.env.CHAINLINK_FEE;

    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy(ticketPrice, housePercentage, maxWinners, vrfCoordinator, linkToken, keyHash, fee);

    console.log("Lottery contract deployed to:", lottery.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
