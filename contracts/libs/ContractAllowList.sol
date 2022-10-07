// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ContractAllowList is Ownable, AccessControl{

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMINISTRATOR, msg.sender);
        //addContractAllowList( 0x1E0049783F008A0085193E00003D00cd54003c71);//opensea goerli test network
    }

    bytes32 public constant ADMINISTRATOR = keccak256("ADMINISTRATOR");
    bytes32 public constant CONTRACT_ALLOW_LIST = keccak256("CONTRACT_ALLOW_LIST");

    function addContractAllowList(address _address) public {
        require(hasRole(ADMINISTRATOR, msg.sender), "Caller is not a administrator");
        _grantRole(CONTRACT_ALLOW_LIST, _address);
    }

    function checkContractAllowList(address _address) public view returns(bool){
        if(hasRole(CONTRACT_ALLOW_LIST, _address)){
            return true;
        }else{
            return false;
        }
    }

}