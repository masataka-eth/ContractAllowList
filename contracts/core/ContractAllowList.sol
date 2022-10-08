// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "./interface/IContractAllowList.sol";

contract ContractAllowList is IContractAllowList, AccessControlEnumerable {
    using EnumerableSet for EnumerableSet.AddressSet;

    // ==========================================================================
    // Section constants
    // ==========================================================================
    bytes32 public constant ALLOW_LIST_EDITOR = keccak256("ALLOW_LIST_EDITOR");

    // ==========================================================================
    // Section valiables
    // ==========================================================================
    mapping(uint256 =>EnumerableSet.AddressSet) private allowedAddresses;

    // ==========================================================================
    // Section modifier
    // ==========================================================================
    modifier onlyEditor() {
        require(hasRole(ALLOW_LIST_EDITOR, msg.sender), "You are not editor.");
        _;
    }

    // ==========================================================================
    // Section external and public functions
    // ==========================================================================

    constructor(address _governor) {
        _setRoleAdmin(ALLOW_LIST_EDITOR, ALLOW_LIST_EDITOR);
        _setupRole(ALLOW_LIST_EDITOR, _governor);

        // For Test
        allowedAddresses[0].add(0x53b7a2bF95cB4f00c98b115d13c6B6D1483472E3);
        allowedAddresses[0].add(0x976EA74026E726554dB657fA54763abd0C3a0aa9);
        allowedAddresses[1].add(0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65);
    }

    // --------------------------------------------------------------------------
    // For maintain
    // --------------------------------------------------------------------------
    function addAllowed(address _allowd,uint256 _level) external override onlyEditor {
        allowedAddresses[_level].add(_allowd);
    }

    function removeAllowed(address _allowd,uint256 _level) external override onlyEditor {
        allowedAddresses[_level].remove(_allowd);
    }

    function getAllowedList(uint256 _level) external view override returns(address[] memory){
        return allowedAddresses[_level].values();
    }

    // --------------------------------------------------------------------------
    // For user
    // --------------------------------------------------------------------------
    function isAllowed(address _transferer,uint256 _level)
        external
        view
        override
        returns (bool)
    {
        bool Allowed = false;
        for(uint256 i=0; i < _level + 1; i++){
            if(allowedAddresses[_level].contains(_transferer) == true){
                Allowed = true;
                break;
            }
        }
        return Allowed;
    }
}
