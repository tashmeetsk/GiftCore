// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import {ReentrancyGuard} from "contractFactory/lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract GiftContract is ReentrancyGuard{
    //events
    event FundsReceived(address indexed buyer, uint256 amount, uint256 timestamp);

    address immutable private i_factoryAddress;
    address immutable private i_owner;
    address immutable private i_buyer;
    uint256 immutable private i_amount;
    bool public s_isFulfilled;
        
    constructor(address _from, address _owner, uint256 _amount){
        require(_amount > 0, "GiftCard value must be positive");
        require(_from != address(0), "Buyer cannot be zero address");
        require(_owner != address(0), "Owner cannot be zero address");
        
        i_buyer = _from;
        i_amount = _amount;
        i_owner = _owner;
        i_factoryAddress = msg.sender;
        s_isFulfilled = false;
    }   

    receive() external payable{
        fulfill();
    }

    function fulfill() public payable nonReentrant {
        require(!s_isFulfilled, "Already fulfilled");
        require(msg.value == i_amount, "Incorrect amount sent");
        require(msg.sender == i_buyer, "Only the buyer can send funds");
        
        s_isFulfilled = true;
        (bool success, ) = payable(i_owner).call{value: msg.value}("");
        require(success, "Transfer failed");
        
        emit FundsReceived(msg.sender, msg.value, block.timestamp);
    }

    //getters
    function getFactoryAddress() external view returns(address){
        return i_factoryAddress;
    }
    
    function getOwner() external view returns(address){
        return i_owner;
    }
    
    function getBuyer() external view returns(address){
        return i_buyer;
    }
    
    function getAmount() external view returns(uint256){
        return i_amount;
    }
    
    function isFulfilled() external view returns(bool){
        return s_isFulfilled;
    }
}
