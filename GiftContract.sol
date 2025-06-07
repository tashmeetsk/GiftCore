// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.19;

import {ReentrancyGuard} from "contractFactory/lib/openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract Gift is ReentrancyGuard{
    //events
    event FundsRecieved(address indexed buyer, uint256 amount, uint256 timestamp);

    address immutable private s_factoryAddress;
    address immutable private s_owner;
    address immutable private s_buyer;
    uint256 immutable private s_amount;
    bool public s_isFullfilled;
        
    constructor(address _from, address _owner, uint256 _amount){
        require(_amount>0, "GiftCard value cant be zero");
        s_buyer = _from;
        s_amount = _amount;
        s_owner = _owner;
        s_factoryAddress = msg.sender;
        s_isFullfilled = false;
    }   

    receive() external payable{
        fullfill();
    }

    function fullfill() public payable {
        require(msg.value == s_amount, "Incorrect amount sent");
        require(msg.sender == s_buyer, "Only the buyer can send funds");
        s_isFullfilled = true;        
        (bool success, ) = payable(s_owner).call{value: msg.value}("");
        require(success, "Transfer failed");
        emit FundsRecieved(msg.sender, msg.value, block.timestamp);



    }
}