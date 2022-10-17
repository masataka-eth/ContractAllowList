// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../ERC721AntiScam/ERC721AntiScam.sol";

contract MockERC721AntiScam is ERC721AntiScam {
    constructor() ERC721A("MockERC721AntiScam", "MOCK") {
    }

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

}
