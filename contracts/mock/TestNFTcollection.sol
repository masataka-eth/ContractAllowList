// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../ERC721AntiScam/ERC721AntiScam.sol";

contract TestNFTcollection is ERC721AntiScam {
    constructor(address _cal) ERC721Psi("TestNFTcollection", "TEST") {
        _setCAL(_cal);
    }

    function mint(uint256 _mintAmount) public payable {
        _safeMint(msg.sender, _mintAmount);
    }

    /*///////////////////////////////////////////////////////////////
                        OVERRIDES ERC721Lockable
    //////////////////////////////////////////////////////////////*/
    function setTokenLock(uint256[] calldata tokenIds, LockStatus lockStatus)
        external
        override
    {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            require(msg.sender == ownerOf(tokenIds[i]), "not owner.");
        }
        _setTokenLock(tokenIds, lockStatus);
    }

    function setWalletLock(address to, LockStatus lockStatus)
        external
        override
    {
        require(to == msg.sender, "not yourself.");
        _setWalletLock(to, lockStatus);
    }

    function setContractLock(LockStatus lockStatus)
        external
        override
        onlyOwner
    {
        _setContractLock(lockStatus);
    }

    /*///////////////////////////////////////////////////////////////
                    OVERRIDES ERC721RestrictApprove
    //////////////////////////////////////////////////////////////*/
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

    function setCALLevel(uint256 level) external override onlyOwner {
        CALLevel = level;
    }

    function setCAL(address calAddress) external onlyOwner {
        _setCAL(calAddress);
    }
}
