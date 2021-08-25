# Rek Lottery

A decentralized lottery smart contract built using Solidity and Hardhat. The contract allows players to enter a lottery, where the winners are selected randomly and a portion of the prize is sent to the owner (house cut). This contract also supports multiple winners and uses Chainlink VRF for secure random number generation.

## Features

- Ticket Purchase: Players can buy tickets by sending Ether to the contract.
- Random Winner Selection: Winners are selected randomly using Chainlink VRF.
- Multiple Winners: The contract can select multiple winners in each round.
- House Cut: A percentage of the prize is transferred to the contract owner.
- Owner Controls: The contract owner can change the ticket price, house percentage, max winners, and withdraw funds.
- Reentrancy Guard: Ensures safe execution by preventing reentrancy attacks.
- Test Coverage: Full unit tests to ensure contract functionality is covered.
