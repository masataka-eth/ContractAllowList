// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../ERC721AntiScam/ERC721AntiScam.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract TestNFTcollection is ERC721AntiScam, AccessControl {
    bytes32 public ADMIN = "ADMIN";

    constructor(address _cal) ERC721A("TestNFTcollection", "TEST") {
        _setCAL(_cal);
        _setupRole(ADMIN, msg.sender);
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
        CALLevel = level;
    }

    function setCAL(address calAddress) external onlyRole(ADMIN) {
        _setCAL(calAddress);
    }

    /*///////////////////////////////////////////////////////////////
                    OVERRIDES ERC721AntiScam
    //////////////////////////////////////////////////////////////*/
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721AntiScam, AccessControl)
        returns (bool)
    {
        return
            AccessControl.supportsInterface(interfaceId) ||
            ERC721AntiScam.supportsInterface(interfaceId);
    }
}
