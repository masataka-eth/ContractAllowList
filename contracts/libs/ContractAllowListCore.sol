// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract ContractAllowListCore is AccessControlEnumerable{

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN, msg.sender);
        //addContractAllowList( 0x1E0049783F008A0085193E00003D00cd54003c71);//opensea goerli test network
    }

    bytes32 public constant ADMIN = keccak256("ADMIN");
    bytes32 public constant SETTER = keccak256("SETTER");
    bytes32 public constant CONTRACT_ALLOW_LIST = keccak256("CONTRACT_ALLOW_LIST");   

    // modifier
    modifier onlyAdmin() {
        require(hasRole(ADMIN, msg.sender), "Caller is not a administrator.");
        _;
    }
    modifier  onlySetter() {
        require(hasRole(ADMIN, msg.sender) || hasRole(SETTER, msg.sender), "Caller is not a setter.");
        _;
    }

    // external
    function setAdminRole(address[] memory admins) external onlyAdmin{
        for (uint256 i = 0; i < admins.length; i++) {
            _setupRole(ADMIN, admins[i]);
        }
    }

    function revokeAdminRole(address[] memory admins) external onlyAdmin{
        for (uint256 i = 0; i < admins.length; i++) {
            _revokeRole(ADMIN, admins[i]);
        }
    }

    function addContractAllowList(address _address) external onlySetter{
        _setupRole(CONTRACT_ALLOW_LIST, _address);
    }

    function deleteContractAllowList(address _address) external onlyAdmin{
        _revokeRole(CONTRACT_ALLOW_LIST, _address);
    }

    function getContractAllowList() external view returns(address[] memory){
        uint256 ListCnt =  getRoleMemberCount(CONTRACT_ALLOW_LIST);
        address[] memory allowaddress = new address[](ListCnt);
        for(uint256 i; i < ListCnt; i++){
            allowaddress[i] = getRoleMember(CONTRACT_ALLOW_LIST,i);
        }
        return allowaddress;
    }

    function checkContractAllowList(address _address) external view returns(bool){
        if(hasRole(CONTRACT_ALLOW_LIST, _address)){
            return true;
        }else{
            return false;
        }
    }

}