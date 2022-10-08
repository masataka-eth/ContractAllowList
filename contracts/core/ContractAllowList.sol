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
    EnumerableSet.AddressSet private _allowedAddresses;

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

    constructor(address governor) {
        _setRoleAdmin(ALLOW_LIST_EDITOR, ALLOW_LIST_EDITOR);
        _setupRole(ALLOW_LIST_EDITOR, governor);

        // For Test
        _allowedAddresses.add(0x53b7a2bF95cB4f00c98b115d13c6B6D1483472E3);
        _allowedAddresses.add(0x976EA74026E726554dB657fA54763abd0C3a0aa9);
    }

    // --------------------------------------------------------------------------
    // For maintain
    // --------------------------------------------------------------------------
    function addAllowed(address allowd) external override onlyEditor {
        _allowedAddresses.add(allowd);
    }

    function removeAllowed(address allowd) external override onlyEditor {
        _allowedAddresses.remove(allowd);
    }

    function getAllowedList() external view override returns(address[] memory){
        return _allowedAddresses.values();
    }

    // --------------------------------------------------------------------------
    // For user
    // --------------------------------------------------------------------------
    function isAllowed(address transferer)
        external
        view
        override
        returns (bool)
    {
        return _allowedAddresses.contains(transferer);
    }
}
