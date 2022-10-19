// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../ERC721AntiScam/ERC721AntiScam.sol";

contract TestNFTcollection is ERC721AntiScam {
    constructor(address _cal) ERC721A("TestNFTcollection", "TEST") {
        CAL = IContractAllowListProxy(_cal);
    }

    function mint(uint256 _mintAmount) public payable {
        _safeMint(msg.sender, _mintAmount);
    }

    function setLocalContractAllowList(address _contract, bool _state)
        external
    {}

    function setLock(LockStatus status, uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender);
        _lock(status, tokenId);
    }

    function setLockAdmin(LockStatus status, uint256 tokenId) public onlyOwner{
        _lock(status, tokenId);
    }

}
