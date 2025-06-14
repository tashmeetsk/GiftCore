// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import {ReentrancyGuard} from "contractFactory/lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";
import {GiftContract} from "contractFactory/src/GiftContract.sol";

contract GiftContractFactory is ReentrancyGuard {

    // events
    event GiftContractCreated(address indexed contractAddress, address indexed owner, address indexed buyer, uint256 amount);
    event FactoryOwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FactoryPaused(address indexed owner, uint256 timestamp);
    event FactoryUnpaused(address indexed owner, uint256 timestamp);

    address private s_owner;
    address[] public deployedContracts;
    bool public factoryPaused;
    mapping(address => bool) public isDeployed;
    mapping(address => address[]) public contractsByBuyer;
    mapping(address => address[]) public contractsByOwner;

    constructor(){
        s_owner = msg.sender;
        factoryPaused = false;
    }

    modifier onlyOwner() {
        require(msg.sender == s_owner, "Only the owner can call this function");
        _;
    }

    modifier whenNotPaused() {
        require(!factoryPaused, "Factory is currently paused");
        _;
    }

    function createGiftContract(address _buyer, uint256 _amount) external onlyOwner whenNotPaused returns (address) {
        require(_buyer != address(0), "Buyer cannot be zero address");
        require(_amount > 0, "Amount must be greater than zero");

        GiftContract newContract = new GiftContract(_buyer, s_owner, _amount);
        address contractAddress = address(newContract);

        deployedContracts.push(contractAddress);
        isDeployed[contractAddress] = true;
        contractsByBuyer[_buyer].push(contractAddress);
        contractsByOwner[s_owner].push(contractAddress);

        emit GiftContractCreated(contractAddress, s_owner, _buyer, _amount);

        return contractAddress;
    }

    function pauseFactory() external onlyOwner {
        require(!factoryPaused, "Factory is already paused");
        factoryPaused = true;
        emit FactoryPaused(msg.sender, block.timestamp);
    }

    function unpauseFactory() external onlyOwner {
        require(factoryPaused, "Factory is not paused");
        factoryPaused = false;
        emit FactoryUnpaused(msg.sender, block.timestamp);
    }

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner is the zero address");
        address previousOwner = s_owner;
        s_owner = _newOwner;

        emit FactoryOwnershipTransferred(previousOwner, _newOwner);
    }

    //getters
    function getOwner() external view returns (address) {
        return s_owner;
    }
    
    function getContractsByBuyer(address _buyer) external view returns (address[] memory) {
        return contractsByBuyer[_buyer];
    }
    
    function getContractsByOwner(address _owner) external view returns (address[] memory) {
        return contractsByOwner[_owner];
    }
    
    function getDeployedContracts() external view returns (address[] memory) {
        return deployedContracts;
    }
    
    function isContractDeployed(address _contractAddress) external view returns (bool) {
        return isDeployed[_contractAddress];
    }

    function getFactoryStatus() external view returns (bool isPaused, uint256 totalContracts) {
        return (factoryPaused, deployedContracts.length);
    }

    receive() external payable {
        revert("Direct payments not allowed, use createGiftContract");
    }
}
