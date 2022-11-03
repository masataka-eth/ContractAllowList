// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IERC721AntiScam.sol";
import "./lockable/ERC721Lockable.sol";
import "./restrictApprove/ERC721RestrictApprove.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AntiScam機能付きERC721A
/// @dev Readmeを見てください。

abstract contract ERC721AntiScam is
    IERC721AntiScam,
    ERC721Lockable,
    ERC721RestrictApprove,
    Ownable
{
    function setCAL(address _cal) external onlyOwner {
        _setCAL(_cal);
    }

    /*///////////////////////////////////////////////////////////////
                              OVERRIDES
    //////////////////////////////////////////////////////////////*/

    function isApprovedForAll(address owner, address operator)
        public
        view
        virtual
        override(ERC721Lockable, ERC721RestrictApprove)
        returns (bool)
    {
        if (isLocked(owner) || !_isAllowed(owner, operator)) {
            return false;
        }
        return super.isApprovedForAll(owner, operator);
    }

    function setApprovalForAll(address operator, bool approved)
        public
        virtual
        override(ERC721Lockable, ERC721RestrictApprove)
    {
        require(
            isLocked(msg.sender) == false || approved == false,
            "Can not approve locked token"
        );
        require(
            _isAllowed(operator) || approved == false,
            "RestrictApprove: Can not approve locked token"
        );
        super.setApprovalForAll(operator, approved);
    }

    function approve(address to, uint256 tokenId)
        public
        payable
        virtual
        override(ERC721Lockable, ERC721RestrictApprove)
    {
        if (to != address(0)) {
            require(
                isLocked(tokenId) == false,
                "Lockable: Can not approve locked token"
            );
            require(
                _isAllowed(tokenId, to),
                "RestrictApprove: The contract is not allowed."
            );
        }
        super.approve(to, tokenId);
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 quantity
    ) internal virtual override(ERC721A, ERC721Lockable) {
        super._beforeTokenTransfers(from, to, startTokenId, quantity);
    }

    function _afterTokenTransfers(
        address from,
        address, /*to*/
        uint256 startTokenId,
        uint256 /*quantity*/
    ) internal virtual override(ERC721Lockable, ERC721RestrictApprove) {
        // 転送やバーンにおいては、常にstartTokenIdは TokenIDそのものとなります。
        if (from != address(0)) {
            _deleteTokenCALLevel(startTokenId);
            _deleteTokenLock(startTokenId);
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Lockable, ERC721RestrictApprove)
        returns (bool)
    {
        return
            interfaceId == type(IERC721AntiScam).interfaceId ||
            interfaceId == type(IERC721Lockable).interfaceId ||
            interfaceId == type(IERC721RestrictApprove).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
