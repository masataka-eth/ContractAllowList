// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "../ERC721AntiScam/ERC721AntiScam.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract MarketDummy {
    constructor() {
    }

    function callIsApprovedForAll(address target, address owner, address operator) public view returns (bool) {
        IERC721 targetContract = IERC721(target);
        return targetContract.isApprovedForAll(owner, operator);
    }

    function callSetApprovalForAll(address target, address operator, bool approved) public {
        IERC721 targetContract = IERC721(target);
        targetContract.setApprovalForAll(operator, approved);
    }

    function callApprove(address target, address to, uint256 tokenId) public {
        IERC721 targetContract = IERC721(target);
        targetContract.approve(to, tokenId);
    }

    function callSafeTransferFrom(
        address target,
        address from,
        address to,
        uint256 tokenId
    ) public {
        IERC721 targetContract = IERC721(target);
        targetContract.safeTransferFrom(from, to, tokenId);
    }

    function callSafeTransferFrom(
        address target,
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public {
        IERC721 targetContract = IERC721(target);
        targetContract.safeTransferFrom(from, to, tokenId, _data);
    }

    function callTransferFrom(
        address target,
        address from,
        address to,
        uint256 tokenId
    ) public {
        IERC721 targetContract = IERC721(target);
        targetContract.transferFrom(from, to, tokenId);
    }

}
