// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "erc721a/contracts/ERC721A.sol";
import './IERC721AntiScam.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../proxy/interface/IContractAllowListProxy.sol";

/// @title AntiScam機能付きERC721A
/// @dev Readmeを見てください。

abstract contract ERC721AntiScam is ERC721A, IERC721AntiScam, Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    IContractAllowListProxy public CAL;
    EnumerableSet.AddressSet localAllowedAddresses;

    /*//////////////////////////////////////////////////////////////
    ロック変数。トークンごとに個別ロック設定を行う
    //////////////////////////////////////////////////////////////*/

    mapping(uint256 => LockStatus) internal _lockStatus;
    LockStatus public contractLockStatus = LockStatus.CalLock;
    uint256 public CALLevel = 1;

    /*///////////////////////////////////////////////////////////////
    ロック機能ロジック
    //////////////////////////////////////////////////////////////*/

    function getLockStatus(uint256 tokenId) public virtual view returns (LockStatus) {
        require(_exists(tokenId), "AntiScam: locking query for nonexistent token");
        return _lockStatus[tokenId];
    }

    function lock(LockStatus level, uint256 id) external virtual onlyOwner {
        _lockStatus[id] = level;
    }

    function getLocked(address to, uint256 tokenId) public virtual view returns(bool) {
        LockStatus status = contractLockStatus;
        if (uint(_lockStatus[tokenId]) >= 1) {
            status = _lockStatus[tokenId];
        }

        return _getLocked(to, status);
    }
    
    function _getLocked(address to, LockStatus status) internal virtual view returns(bool){
        if (status == LockStatus.UnLock) {
            return false;
        } else if (status == LockStatus.AllLock)  {
            return true;
        } else if (status == LockStatus.CalLock) {
            if (isLocalAllowed(to)) {
                return false;
            }
            if (address(CAL) == address(0)) {
                return true;
            }
            if (CAL.isAllowed(to, CALLevel)) {
                return false;
            } else {
                return true;
            }
        } else {
            revert("LockStatus is invalid");
        }
    }

    function addLocalContractAllowList(address _contract) external onlyOwner {
        localAllowedAddresses.add(_contract);
    }

    function removeLocalContractAllowList(address _contract) external onlyOwner {
        localAllowedAddresses.remove(_contract);
    }

    function isLocalAllowed(address _transferer)
        public
        view
        returns (bool)
    {
        bool Allowed = false;
        if(localAllowedAddresses.contains(_transferer) == true){
            Allowed = true;
        }
        return Allowed;
    }

    function setContractAllowListLevel(uint256 level) external onlyOwner{
        CALLevel = level;
    }

    function setContractLockStatus(LockStatus _status) external onlyOwner {
       require(_status != LockStatus.UnSet, "AntiScam: contract lock status can not set UNSET");
       contractLockStatus = _status;
    }

    function setCAL(address _cal) external onlyOwner {
        CAL = IContractAllowListProxy(_cal);
    }


    /*///////////////////////////////////////////////////////////////
                              OVERRIDES
    //////////////////////////////////////////////////////////////*/

    function isApprovedForAll(address owner, address operator) public view virtual override returns (bool) {
        if(_getLocked(operator, contractLockStatus)){
            return false;
        }
        return super.isApprovedForAll(owner, operator);
    }

    function setApprovalForAll(address operator, bool approved) public virtual override {
        require (_getLocked(operator, contractLockStatus) == false || approved == false, "Can not approve locked token");
        super.setApprovalForAll(operator, approved);
    }

    function approve(address to, uint256 tokenId) public payable virtual override {
        require (getLocked(to, tokenId) == false, "Can not approve locked token");
        super.approve(to, tokenId);
    }

    function _beforeTokenTransfers(
        address from,
        address to,
        uint256 startTokenId,
        uint256 /*quantity*/
    ) internal virtual override {
        // 転送やバーンにおいては、常にstartTokenIdは TokenIDそのものとなります。
        if (from != address(0)) {
            // トークンがロックされている場合、転送を許可しない
            require(getLocked(to, startTokenId) == false , "LOCKED");
        }
    }

    function _afterTokenTransfers(
        address from,
        address /*to*/,
        uint256 startTokenId,
        uint256 /*quantity*/
    ) internal virtual override {
        // 転送やバーンにおいては、常にstartTokenIdは TokenIDそのものとなります。
        if (from != address(0)) {
            // ロックをデフォルトに戻す。（デフォルトは、 contractのLock status）
            delete _lockStatus[startTokenId];
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
            interfaceId == type(IERC721AntiScam).interfaceId ||
            super.supportsInterface(interfaceId);
    }

}