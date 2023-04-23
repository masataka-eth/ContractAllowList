// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../AntiScam/AntiScamWallet.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "erc721psi/contracts/ERC721Psi.sol";

import "hardhat/console.sol";

contract ExampleERC721PsiAntiScamWallet is ERC721Psi, AntiScamWallet, AccessControl {
    bytes32 public ADMIN = "ADMIN";
    
    constructor(address _cal) ERC721Psi("ExampleERC721Psi", "E721PSI") initializerAntiScam {
        _setCAL(_cal);
        _setupRole(ADMIN, msg.sender);
        __AntiScamWallet_init();
    }

    function mint(uint256 _mintAmount) public payable {
        _mint(msg.sender, _mintAmount);
    }

    /*///////////////////////////////////////////////////////////////
                        OVERRIDES WalletLockable
    //////////////////////////////////////////////////////////////*/

    function setWalletLock(address to, LockStatus lockStatus)
        external
        override
    {
        require(to == msg.sender, "not yourself.");
        _setWalletLock(to, lockStatus);
    }

    function unlockWalletByAdmin(address to) external onlyRole(ADMIN) {
        _setWalletLock(to, LockStatus.UnLock);
    }

    function setDefaultLock(LockStatus lockStatus)
        external
        override
        onlyRole(ADMIN)
    {
        _setDefaultLock(lockStatus);
    }

    function setContractLock(LockStatus lockStatus)
        external
        override
        onlyRole(ADMIN)
    {
        _setContractLock(lockStatus);
    }

    /*///////////////////////////////////////////////////////////////
                    OVERRIDES ERC721RestrictApprove
    //////////////////////////////////////////////////////////////*/
    function addLocalContractAllowList(address transferer)
        external
        override
        onlyRole(ADMIN)
    {
        _addLocalContractAllowList(transferer);
    }

    function removeLocalContractAllowList(address transferer)
        external
        override
        onlyRole(ADMIN)
    {
        _removeLocalContractAllowList(transferer);
    }

    function setCALLevel(uint256 level) external override onlyRole(ADMIN) {
        _setCALLevel(level);
    }

    function setCAL(address calAddress) external onlyRole(ADMIN) {
        _setCAL(calAddress);
    }

    ///////////////////////////////////////////////////////////////////////////
    // ERC721Psi Approve and transfer functions with AntiScam
    ///////////////////////////////////////////////////////////////////////////
    function _beforeTokenTransfers(address from, address to, uint256 startTokenId, uint256 quantity) 
        internal 
        virtual 
        override
        onlyTransferable(from, to, startTokenId, quantity)
    {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }

    function approve(address to, uint256 tokenId) 
        public 
        virtual 
        override
        onlyTokenApprovable(to, tokenId)
    {
        super.approve(to, tokenId);
    }

    function isApprovedForAll(address holder, address operator)
        public
        view
        virtual
        override
        returns (bool)
    {
        return super.isApprovedForAll(holder, operator) && _isWalletApprovable(operator, holder);
    }

    function setApprovalForAll(address operator, bool approved)
        public
        virtual
        override
        onlyWalletApprovable(operator, msg.sender, approved)
    {
        super.setApprovalForAll(operator, approved);
    }

    /*///////////////////////////////////////////////////////////////
                    OVERRIDES ERC721AntiScam
    //////////////////////////////////////////////////////////////*/
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Psi, AccessControl)
        returns (bool)
    {
        return
            AccessControl.supportsInterface(interfaceId) ||
            ERC721Psi.supportsInterface(interfaceId);
    }
}
