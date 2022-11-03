// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

import './IERC721AntiScamControl.sol';
import '../ERC721AntiScam.sol';

abstract contract ERC721AntiScamControl is IERC721AntiScamControl, ERC721AntiScam {
    mapping(address => bool) _operators;

    modifier onlyLocker() {
        checkLockerRole(msg.sender);
        _;
    }

    /**
     * @dev トークンレベルでロックする
     */
    function lock(uint256[] calldata tokenIds) external virtual override onlyLocker {
        _lock(tokenIds);
    }

    /**
     * @dev トークンレベルでのロックを解除する
     */
    function unlock(uint256[] calldata tokenIds) external virtual override onlyLocker {
        _unlock(tokenIds);
    }

    /**
     * @dev トークン所有者のウォレットアドレスをロックする
     */
    function lockWallet(address to) external virtual override onlyLocker {
        _lockWallet(to);
    }

    /**
     * @dev トークン所有者のウォレットアドレスのロックを解除する
     */
    function unlockWallet(address to) external virtual override onlyLocker {
        _unlockWallet(to);
    }

    function isLocker(address operator) public view returns (bool) {
        return _operators[operator];
    }

    function _grantLockerRole(address candidate) internal {
        require(!_operators[candidate],'account is already has an operator role');
        _operators[candidate] = true;
    }

    function _revokeLockerRole(address candidate) internal {
        checkLockerRole(candidate);
        delete _operators[candidate];
    }

    function checkLockerRole(address operator) public view {
        require(_operators[operator],'account is not an locker');
    }
}
