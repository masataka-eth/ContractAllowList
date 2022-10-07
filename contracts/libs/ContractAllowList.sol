// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interface/iContractAllowListCore.sol";

contract ContractAllowList is Ownable, AccessControl{

    iContractAllowListCore public iCALcore;
    constructor() {
        iCALcore = iContractAllowListCore(0x53b7a2bF95cB4f00c98b115d13c6B6D1483472E3);   
    } 

    function setICALcore(address _address) external onlyOwner {
        iCALcore = iContractAllowListCore(_address);
    }

    function checkContractAllowList(address _address) external view returns(bool){
        return iCALcore.checkContractAllowList(_address);
    }

}