// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../ERC721AntiScam/ERC721AntiScam.sol";

contract TestNFTcollection is ERC721AntiScam {
    constructor(address _cal) ERC721A("TestNFTcollection", "TEST") {
        _setCAL(_cal);
    }

    function mint(uint256 _mintAmount) public payable {
        _safeMint(msg.sender, _mintAmount);
    }

    function lock(uint256[] calldata tokenIds) external virtual override {
        for(uint256 i=0; i < tokenIds.length; i++){
            require(msg.sender == ownerOf(tokenIds[i]), "not owner.");
        }
        _lock(tokenIds);
    }
    
    function unlock(uint256[] calldata tokenIds) external virtual override {
        for(uint256 i=0; i < tokenIds.length; i++){
            require(msg.sender == ownerOf(tokenIds[i]), "not owner.");
        }
        _unlock(tokenIds);
    }
    
    function addLocalContractAllowList(address transferer)
        external
        override
        onlyOwner
    {
        _addLocalContractAllowList(transferer);
    }

    function removeLocalContractAllowList(address transferer)
        external
        override
        onlyOwner
    {
        _removeLocalContractAllowList(transferer);
    }

    function setCalLevel(uint256 level) external override onlyOwner {
        CALLevel = level;
    }

    function setContractLockStatus(LockStatus lockStatus) external onlyOwner {
        contractLockStatus = lockStatus;
    }
}
