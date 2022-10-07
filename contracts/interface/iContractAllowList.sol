// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

//contract allow list interface
interface iContractAllowList {
    function checkContractAllowList(address _address) external view returns (bool);
}