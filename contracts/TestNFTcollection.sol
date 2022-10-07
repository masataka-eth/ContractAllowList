// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "erc721a/contracts/extensions/ERC721AQueryable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interface/iContractAllowList.sol";

contract TestNFTcollection is ERC721A, Ownable, AccessControl{

    constructor(
    ) ERC721A("TestNFTcollection", "TEST") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(AIRDROP_ROLE      , msg.sender);
        setBaseURI("https://data.zqn.wtf/sanuqn/metadata/");
        _safeMint(0xdEcf4B112d4120B6998e5020a6B4819E490F7db6, 1);//atode kesu
        setUseContractAllowList(true);
    }

    //
    //withdraw section
    //
    address public constant withdrawAddress = 0xdEcf4B112d4120B6998e5020a6B4819E490F7db6;

    function withdraw() public onlyOwner {
        (bool os, ) = payable(withdrawAddress).call{value: address(this).balance}('');
        require(os);
    }

    //
    //mint section
    //
    uint256 public cost = 0;
    uint256 public maxSupply = 10000;
    uint256 public maxMintAmountPerTransaction = 10;
    bool public paused = true;
    bool public onlyWhitelisted = true;
    mapping(address => uint256) public whitelistMintedAmount;
    bytes32 public constant AIRDROP_ROLE = keccak256("AIRDROP_ROLE");

    modifier callerIsUser() {
        require(tx.origin == msg.sender, "The caller is another contract.");
        _;
    }

    //mint with mapping
    mapping(address => uint256) public whitelistUserAmount;
    function mint(uint256 _mintAmount ) public payable callerIsUser{
        require(!paused, "the contract is paused");
        require(0 < _mintAmount, "need to mint at least 1 NFT");
        require(_mintAmount <= maxMintAmountPerTransaction, "max mint amount per session exceeded");
        require(totalSupply() + _mintAmount <= maxSupply, "max NFT limit exceeded");
        require(cost * _mintAmount <= msg.value, "insufficient funds");
        if(onlyWhitelisted == true) {
            require( whitelistUserAmount[msg.sender] != 0 , "user is not whitelisted");
            require(_mintAmount <= whitelistUserAmount[msg.sender] - whitelistMintedAmount[msg.sender] , "max NFT per address exceeded");
            whitelistMintedAmount[msg.sender] += _mintAmount;
        }
        _safeMint(msg.sender, _mintAmount);
    }

    function setWhitelist(address[] memory addresses, uint256[] memory saleSupplies) public onlyOwner {
        require(addresses.length == saleSupplies.length);
        for (uint256 i = 0; i < addresses.length; i++) {
            whitelistUserAmount[addresses[i]] = saleSupplies[i];
        }
    }    

    function airdropMint(address[] calldata _airdropAddresses , uint256[] memory _UserMintAmount) public {
        require(hasRole(AIRDROP_ROLE, msg.sender), "Caller is not a air dropper");
        uint256 _mintAmount = 0;
        for (uint256 i = 0; i < _UserMintAmount.length; i++) {
            _mintAmount += _UserMintAmount[i];
        }
        require(0 < _mintAmount , "need to mint at least 1 NFT");
        require(totalSupply() + _mintAmount <= maxSupply, "max NFT limit exceeded");
        for (uint256 i = 0; i < _UserMintAmount.length; i++) {
            _safeMint(_airdropAddresses[i], _UserMintAmount[i] );
        }
    }

    function setMaxSupply(uint256 _maxSupply) public onlyOwner() {
        maxSupply = _maxSupply;
    }

    function setCost(uint256 _newCost) public onlyOwner {
        cost = _newCost;
    }

    function setOnlyWhitelisted(bool _state) public onlyOwner {
        onlyWhitelisted = _state;
    }

    function setMaxMintAmountPerTransaction(uint256 _maxMintAmountPerTransaction) public onlyOwner {
        maxMintAmountPerTransaction = _maxMintAmountPerTransaction;
    }
  
    function pause(bool _state) public onlyOwner {
        paused = _state;
    }


    //
    //URI section
    //
    string public baseURI;
    string public baseExtension = ".json";

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;        
    }

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function setBaseExtension(string memory _newBaseExtension) public onlyOwner {
        baseExtension = _newBaseExtension;
    }

    //
    //token URI
    //
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked(ERC721A.tokenURI(tokenId), baseExtension));
    }

    //
    //viewer section
    //
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        unchecked {
            uint256 tokenIdsIdx;
            address currOwnershipAddr;
            uint256 tokenIdsLength = balanceOf(owner);
            uint256[] memory tokenIds = new uint256[](tokenIdsLength);
            TokenOwnership memory ownership;
            for (uint256 i = _startTokenId(); tokenIdsIdx != tokenIdsLength; ++i) {
                ownership = _ownershipAt(i);
                if (ownership.burned) {
                    continue;
                }
                if (ownership.addr != address(0)) {
                    currOwnershipAddr = ownership.addr;
                }
                if (currOwnershipAddr == owner) {
                    tokenIds[tokenIdsIdx++] = i;
                }
            }
            return tokenIds;
        }
    }

    //
    // Contract Allow List section
    //
    iContractAllowList iCAL = iContractAllowList(0x53b7a2bF95cB4f00c98b115d13c6B6D1483472E3);

    bool public useContractAllowList = false;

    function setUseContractAllowList(bool _state) public onlyOwner {
        useContractAllowList = _state;
    }

    function setICAL(address _address) public onlyOwner {
        iCAL = iContractAllowList(_address);
    }

    function _useContractAllowList() internal view returns (bool) {
        return useContractAllowList;
    }    

    function setApprovalForAll(address operator, bool approved) public virtual override {
        if( _useContractAllowList() ){
            require( iCAL.checkContractAllowList(operator) , "setApprovalForAll is prohibited");
        }
        super.setApprovalForAll(operator, approved);
    }

    function approve(address to, uint256 tokenId) public payable virtual override {
        if( _useContractAllowList() ){
            require( iCAL.checkContractAllowList(to) , "approve is prohibited");
        }
        super.approve(to, tokenId);
    }



    //
    //override
    //

    function supportsInterface(bytes4 interfaceId) public view override(ERC721A, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _startTokenId() internal view virtual override returns (uint256) {
        return 1;
    }


}