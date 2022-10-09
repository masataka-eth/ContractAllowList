// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC721/extensions/draft-ERC721Votes.sol";

contract CALVoteToken is ERC721Votes {
    constructor() ERC721("CALVoteToken", "CALVT") EIP712("CALVoteToken", "1") {}

    // ==========================================================================
    // Section valiables
    // ==========================================================================
    uint256 private _count = 0;

    // ==========================================================================
    // Section modifier
    // ==========================================================================
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == _msgSender(), "You are not token owner.");
        _;
    }

    // ==========================================================================
    // Section external and public functions
    // ==========================================================================
    function mint() external {
        _safeMint(_msgSender(), _count);
        _count++;
    }

    function burn(uint256 tokenId) external onlyTokenOwner(tokenId) {
        _burn(tokenId);
    }
}
