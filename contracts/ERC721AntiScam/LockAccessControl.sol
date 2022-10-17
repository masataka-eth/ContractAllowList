// SPDX-License-Identifier: MIT
pragma solidity >=0.8.9;

abstract contract LockAccessControl  {
    mapping(address => bool) _operators;

    modifier onlyLocker() {
        _checkLockerRole(msg.sender);
        _;
    }

    function isLocker(address _operator) public view returns (bool) {
        return _operators[_operator];
    }

    function _grantOperatorRole(address _candidate) internal {
        require(!_operators[_candidate],'account is already has an operator role');
        _operators[_candidate] = true;
    }

    function _revokeOperatorRole(address _candidate) internal {
        _checkLockerRole(_candidate);
        delete _operators[_candidate];
    }

    function _checkLockerRole(address _operator) internal view {
        require(_operators[_operator],'account is not an locker');
    }
}
