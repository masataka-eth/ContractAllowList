// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../core/interface/IContractAllowList.sol";

contract ContractAllowListProxy is Ownable {
    IContractAllowList public ICALcore;

    constructor(address _address) {
        ICALcore = IContractAllowList(_address);   
    } 

    function setICALcore(address _address) external onlyOwner {
        ICALcore = IContractAllowList(_address);
    }

    function isAllowed(address _transferer,uint256 _level) external view returns(bool){
        return ICALcore.isAllowed(_transferer,_level);
    }
}
