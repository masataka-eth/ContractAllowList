// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

import "../../ERC721AntiScam/extensions/ERC721AntiScamControl.sol";

contract MockERC721AntiScamControl is ERC721AntiScamControl {
    constructor() ERC721A("MockERC721AntiScamControl", "MOCK") {}

    function mint(uint256 _mintAmount) public payable {
        _safeMint(msg.sender, _mintAmount);
    }

    /**
        @dev LockerRole Role
     */
    function grantLockerRole(address _candidate) external onlyOwner {
        _grantLockerRole(_candidate);
    }

    function revokeLockerRole(address _candidate) external onlyOwner {
        _revokeLockerRole(_candidate);
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

    function getLocalContractAllowList()
        external
        override
        view
        returns(address[] memory)
    {
        return _getLocalContractAllowList();
    }
    
    function setCALLevel(uint256 level) external override onlyOwner {
        CALLevel = level;
    }
    
    function setCAL(address calAddress) external onlyOwner {
        _setCAL(calAddress);
    }
}
