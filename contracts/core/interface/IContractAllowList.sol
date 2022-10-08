// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

interface IContractAllowList {
    // --------------------------------------------------------------------------
    // For maintain
    // --------------------------------------------------------------------------
    function addAllowed(address allowd) external;
    
    function removeAllowed(address allowd) external;

    function getAllowedList() external view returns(address[] memory);

    // --------------------------------------------------------------------------
    // For user
    // --------------------------------------------------------------------------
    function isAllowed(address transferer)
        external
        view
        returns (bool);
}
