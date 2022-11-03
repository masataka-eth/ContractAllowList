// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "./IERC721Lockable.sol";
import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

/// @title トークンのtransfer抑止機能付きコントラクト
/// @dev Readmeを見てください。

abstract contract ERC721Lockable is ERC721A, IERC721Lockable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /*//////////////////////////////////////////////////////////////
    ロック変数。トークンごとに個別ロック設定を行う
    //////////////////////////////////////////////////////////////*/
    bool public enableLock = true;
    LockStatus public contractLockStatus = LockStatus.UnLock;

    // token lock 0:unset, 1:unlock, 2:lock
    mapping(uint256 => LockStatus) internal _tokenLock;

    // wallet lock 0:unset, 1:unlock, 2:lock
    mapping(address => LockStatus) internal _walletLock;

    /*//////////////////////////////////////////////////////////////
    ロック変数。トークンごとに個別ロック設定を行う
    //////////////////////////////////////////////////////////////*/
    modifier existToken(uint256 tokenId) {
        require(
            _exists(tokenId),
            "Lockable: locking query for nonexistent token"
        );
        _;
    }

    /*///////////////////////////////////////////////////////////////
    ロック機能ロジック
    //////////////////////////////////////////////////////////////*/

    // function getLockStatus(uint256 tokenId) external view returns (LockStatus) existToken(tokenId) {
    //     return _getLockStatus(ownerOf(tokenId), tokenId);
    // }

    function isLocked(uint256 tokenId)
        public
        view
        existToken(tokenId)
        returns (bool)
    {
        if (enableLock) {
            return false;
        }

        if (
            _tokenLock[tokenId] == LockStatus.Lock ||
            (_tokenLock[tokenId] == LockStatus.UnSet &&
                isLocked(ownerOf(tokenId)))
        ) {
            return true;
        }

        return false;
    }

    function isLocked(address holder) public view returns (bool) {
        if (!enableLock) {
            return false;
        }

        if (
            _walletLock[holder] == LockStatus.Lock ||
            (_walletLock[holder] == LockStatus.UnSet &&
                contractLockStatus == LockStatus.Lock)
        ) {
            return true;
        }

        return false;
    }

    function getTokensUnderLock() public view returns (uint256[] memory) {
        uint256 start = _startTokenId();
        uint256 end = _nextTokenId();

        return getTokensUnderLock(start, end);
    }

    function getTokensUnderLock(uint256 start, uint256 end)
        public
        view
        returns (uint256[] memory)
    {}

    /*///////////////////////////////////////////////////////////////
                              OVERRIDES
    //////////////////////////////////////////////////////////////*/

    function isApprovedForAll(address owner, address operator)
        public
        view
        virtual
        override
        returns (bool)
    {
        if (isLocked(owner)) {
            return false;
        }
        return super.isApprovedForAll(owner, operator);
    }

    function setApprovalForAll(address operator, bool approved)
        public
        virtual
        override
    {
        require(
            isLocked(msg.sender) == false || approved == false,
            "Can not approve locked token"
        );
        super.setApprovalForAll(operator, approved);
    }

    function approve(address to, uint256 tokenId)
        public
        payable
        virtual
        override
    {
        require(isLocked(tokenId) == false, "Lockable: Can not approve locked token");
        super.approve(to, tokenId);
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 /*quantity*/
    ) internal virtual override {
        // 転送やバーンにおいては、常にstartTokenIdは TokenIDそのものとなります。
        if (from != address(0) || to != address(0)) {
            // トークンがロックされている場合、転送を許可しない
            require(isLocked(startTokenId) == false, "Lockable: Can not transfer locked token");
        }
    }

    function _afterTokenTransfers(
        address from,
        address, /*to*/
        uint256 startTokenId,
        uint256 /*quantity*/
    ) internal virtual override {
        // 転送やバーンにおいては、常にstartTokenIdは TokenIDそのものとなります。
        if (from != address(0)) {
            // ロックをデフォルトに戻す。
            delete _tokenLock[startTokenId];
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == type(IERC721Lockable).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}
