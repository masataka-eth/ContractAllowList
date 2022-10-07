// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ContractAllowListCore is Ownable, AccessControl{

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMINISTRATOR, msg.sender);
        //addContractAllowList( 0x1E0049783F008A0085193E00003D00cd54003c71);//opensea goerli test network
    }

    bytes32 public constant ADMINISTRATOR = keccak256("ADMINISTRATOR");
    bytes32 public constant CONTRACT_ALLOW_LIST = keccak256("CONTRACT_ALLOW_LIST");

    // onlyOwner
    function setAdminRole(address[] memory admins) external onlyOwner{
        for (uint256 i = 0; i < admins.length; i++) {
            _setupRole(ADMINISTRATOR, admins[i]);
        }
    }

    function revokeAdminRole(address[] memory admins) external onlyOwner{
        for (uint256 i = 0; i < admins.length; i++) {
            _revokeRole(ADMINISTRATOR, admins[i]);
        }
    }

    // modifier
    modifier onlyAdmin() {
        require(hasRole(ADMINISTRATOR, msg.sender), "Caller is not a administrator.");
        _;
    }

    // external
    function addContractAllowList(address _address) external onlyAdmin{
        _grantRole(CONTRACT_ALLOW_LIST, _address);
    }

    function deleteContractAllowList(address _address) external onlyAdmin{
        _revokeRole(CONTRACT_ALLOW_LIST, _address);
    }

    function checkContractAllowList(address _address) external view returns(bool){
        if(hasRole(CONTRACT_ALLOW_LIST, _address)){
            return true;
        }else{
            return false;
        }
    }

}