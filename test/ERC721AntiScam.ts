import { loadFixture, time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { allowedAddressesLv1, allowedAddressesLv2, allowedAddressesLocal, deploy } from "./deploy";


describe("ERC721AntiScam", function () {
  const fixture = async () => {
    const [owner, admin, account, ...others] = await ethers.getSigners()
    const contracts = await deploy(owner)

    await contracts.contractAllowList.connect(owner).addAllowed(owner.address, 1)

    return { ...contracts, owner, admin, account, others }
  }

  describe("isApprovedForAll", () => {
    it("setApprovalForAll実行後にロックを厳しくした場合にfalseになること", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted

      expect(await testNFT.isApprovedForAll(account.address, allowedAddressesLv1[0]))
        .to.equals(true)

      await testNFT.connect(owner).setContractLock(2)
      expect(await testNFT.isApprovedForAll(account.address, allowedAddressesLv1[0]))
        .to.equals(false)
    })
  })
  
  describe("setApprovalForAll", () => {
    it("指定レベルの認可対象は成功すること", async () => {
      const { testNFT, account, owner } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted

      await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })

    it("全レベルの認可対象外は失敗すること", async () => {
      const { testNFT, account, owner } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
      await expect(testNFT.connect(account).setApprovalForAll(account.address, true))
        .to.be.reverted
    })

    it("指定レベルに含まない認可対象外は失敗すること", async () => {
      const { testNFT, account, owner } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv2[0], true))
        .to.be.reverted
    })

    it("指定レベルをあげれば成功すること", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCALLevel(2);
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv2[0], true))
        .not.to.be.reverted
      await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })
  })

  const UnSet = 0
  const UnLock = 1
  const Lock = 2

  describe("approve", () => {
    describe("success", () => {
      it("ContractLock = Lock, WalletLock = Lock, TokenLock = UnLock is success", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(Lock);
        await testNFT.connect(account).setWalletLock(account.address, Lock);
        await testNFT.connect(account).setTokenLock([0], UnLock);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .not.to.be.reverted
      })

      it("ContractLock = Lock, WalletLock = UnLock, TokenLock = UnSet is success", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(Lock);
        await testNFT.connect(account).setWalletLock(account.address, UnLock);
        await testNFT.connect(account).setTokenLock([0], UnSet);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .not.to.be.reverted
      })

      it("ContractLock = UnLock, WalletLock = UnSet, TokenLock = UnSet is success", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(UnLock);
        await testNFT.connect(account).setWalletLock(account.address, UnSet);
        await testNFT.connect(account).setTokenLock([0], UnSet);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .not.to.be.reverted
      })

      it("ContractLock = UnSet, WalletLock = UnSet, TokenLock = UnSet is success", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(UnSet);
        await testNFT.connect(account).setWalletLock(account.address, UnSet);
        await testNFT.connect(account).setTokenLock([0], UnSet);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .not.to.be.reverted
      })
    })

    describe("failure", () => {
      it("ContractLock = Lock, WalletLock = Lock, TokenLock = Lock is failure", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(Lock);
        await testNFT.connect(account).setWalletLock(account.address, Lock);
        await testNFT.connect(account).setTokenLock([0], Lock);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("ContractLock = Lock, WalletLock = Lock, TokenLock = UnSet is failure", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(Lock);
        await testNFT.connect(account).setWalletLock(account.address, Lock);
        await testNFT.connect(account).setTokenLock([0], UnSet);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("ContractLock = Lock, WalletLock = UnSet, TokenLock = UnSet is failure", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(Lock);
        await testNFT.connect(account).setWalletLock(account.address, UnSet);
        await testNFT.connect(account).setTokenLock([0], UnSet);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("ContractLock = UnSet, WalletLock = UnSet, TokenLock = Lock is failure", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(UnSet);
        await testNFT.connect(account).setWalletLock(account.address, UnSet);
        await testNFT.connect(account).setTokenLock([0], Lock);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("ContractLock = UnSet, WalletLock = Lock, TokenLock = UnSet is failure", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(UnSet);
        await testNFT.connect(account).setWalletLock(account.address, Lock);
        await testNFT.connect(account).setTokenLock([0], UnSet);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("ContractLock = UnLock, WalletLock = UnLock, TokenLock = Lock is failure", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(UnLock);
        await testNFT.connect(account).setWalletLock(account.address, UnLock);
        await testNFT.connect(account).setTokenLock([0], Lock);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("ContractLock = UnLock, WalletLock = Lock, TokenLock = UnSet is failure", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(UnLock);
        await testNFT.connect(account).setWalletLock(account.address, Lock);
        await testNFT.connect(account).setTokenLock([0], UnSet);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("ContractLock = Lock, WalletLock = UnSet, TokenLock = UnSet is failure", async () => {
        const { testNFT, account, owner } = await loadFixture(fixture)
        await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await testNFT.connect(owner).setCALLevel(1);  //level 0は全拒否
        await testNFT.connect(owner).setContractLock(Lock);
        await testNFT.connect(account).setWalletLock(account.address, UnSet);
        await testNFT.connect(account).setTokenLock([0], UnSet);
        await expect(testNFT.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })
    })
  })

  describe("CALの設定と変更のテスト", () => {
    it("ownerであればCALを後から変更できる", async () => {
      const { testNFT, market, owner, account } = await loadFixture(fixture)

      const NewTimelock = await ethers.getContractFactory("Timelock")
      const newTimelock = await NewTimelock.deploy(2, [ethers.constants.AddressZero], [ethers.constants.AddressZero])
      await newTimelock.deployed()

      const NewContractAllowList = await ethers.getContractFactory("ContractAllowList")
      // Contain owner for test
      const newContractAllowList = await NewContractAllowList.deploy([newTimelock.address, owner.getAddress()])
      await newContractAllowList.deployed()

      const NewContractAllowListProxy = await ethers.getContractFactory("ContractAllowListProxy")
      const newContractAllowListProxy = await NewContractAllowListProxy.deploy(newContractAllowList.address)
      await newContractAllowListProxy.deployed()

      // ownerはCALを設定できる
      await expect(testNFT.connect(owner).setCAL(newContractAllowListProxy.address))
        .not.to.be.reverted
      let gotCAL = await testNFT.CAL()
      expect(gotCAL).to.equals(newContractAllowListProxy.address)

      // owner以外はCALを設定できない
      await expect(testNFT.connect(account).setCAL(newContractAllowListProxy.address)).to.be.reverted

      // ownerは0x000...を設定できる
      await expect(testNFT.connect(owner).setCAL(ethers.constants.AddressZero))
        .not.to.be.reverted
      gotCAL = await testNFT.CAL()
      expect(gotCAL).to.equals(ethers.constants.AddressZero)

    })

    it("CALが0アドレスでもLocalだけで動く", async () => {
      const { testNFT, market, owner, account } = await loadFixture(fixture)

      // ownerは0x000...を設定できる
      await expect(testNFT.connect(owner).setCAL(ethers.constants.AddressZero))
        .not.to.be.reverted

      await expect(testNFT.connect(owner).setContractLock(UnSet))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLocal[0], true))
        .not.to.be.reverted
      await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })

    it("LocalCALの追加と削除", async () => {
      const { testNFT, market, owner, account } = await loadFixture(fixture)
      
      expect((await testNFT.connect(owner).getLocalContractAllowList())[0]).to.equal(allowedAddressesLocal[0])

      // 削除
      expect(await testNFT.connect(owner).removeLocalContractAllowList(allowedAddressesLocal[0])).to.be.ok

      expect((await testNFT.connect(account).getLocalContractAllowList()).length).to.equal(0)

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLocal[0], true))
        .to.be.reverted

      // 追加
      expect(await testNFT.connect(owner).addLocalContractAllowList(allowedAddressesLocal[0])).to.be.ok

      const allowedAddressesLocal2 = ethers.utils.getAddress('0x0dAE5FcaD0DF8E5C029D76927582DFBdFd7eeC79')

      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLocal2, true))
        .to.be.reverted

      expect(await testNFT.connect(owner).addLocalContractAllowList(allowedAddressesLocal2)).to.be.ok

      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLocal2, true))
        .not.to.be.reverted
      await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted

      const localContractAllowList = await testNFT.connect(account).getLocalContractAllowList()
      expect(localContractAllowList.length).to.equal(2)
      expect(localContractAllowList[0]).to.equal(allowedAddressesLocal[0])
      expect(localContractAllowList[1]).to.equal(allowedAddressesLocal2)

    })

  })

  describe("Event", () => {
    it("ロックステータス変更時にEventが発行されること: Lock", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })

      // 所有者によるロックイベント
      await expect(testNFT.connect(account).setTokenLock([0], Lock))
        .to.emit(testNFT, 'TokenLock')
        .withArgs(account.address, account.address, 2, 0)
    })

    it("ロックステータス変更時にEventが発行されること: UnLock", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })

      // 所有者によるロックイベント
      await expect(testNFT.connect(account).setTokenLock([0], UnLock))
        .to.emit(testNFT, 'TokenLock')
        .withArgs(account.address, account.address, 1, 0)
    })

    it("ロックステータス変更時にEventが発行されること: UnSet", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })

      // 所有者によるロックイベント
      await expect(testNFT.connect(account).setTokenLock([0], UnSet))
        .to.emit(testNFT, 'TokenLock')
        .withArgs(account.address, account.address, 0, 0)
    })
  })

  describe("Interface of getTokensUnderLock", () => {
    it("getTokensUnderLockが長さ0の配列を返すこと", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(10, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).mint(10, { value: ethers.utils.parseEther("1") })

      expect(await testNFT["getTokensUnderLock()"]()).to.deep.equals([])
      expect(await testNFT["getTokensUnderLock(uint256,uint256)"](0, 5)).to.deep.equals([]);

      // token lock
      await testNFT.connect(account).setTokenLock([1, 2, 3, 5, 6], Lock)
      expect(await testNFT["getTokensUnderLock()"]()).to.deep.equals([1, 2, 3, 5, 6])
      expect(await testNFT["getTokensUnderLock(uint256,uint256)"](3, 5)).to.deep.equals([3, 5]);

      // wallet lock
      await testNFT.connect(account).setWalletLock(account.address, Lock)
      expect(await testNFT["getTokensUnderLock()"]()).to.deep.equals([...Array(10)].map((_, i) => i))
      expect(await testNFT["getTokensUnderLock(uint256,uint256)"](3, 5)).to.deep.equals([3, 4, 5]);

      // contract lock
      await testNFT.connect(account).setWalletLock(account.address, UnSet)
      await testNFT.connect(owner).setContractLock(Lock)
      expect(await testNFT["getTokensUnderLock()"]()).to.deep.equals([...Array(20)].map((_, i) => i))
      expect(await testNFT["getTokensUnderLock(uint256,uint256)"](9, 11)).to.deep.equals([9, 10, 11]);
    })
  })


  describe("supportsInterfaces", () => {
    it("ERC721", async () => {
      const { testNFT } = await loadFixture(fixture)
      expect(await testNFT.supportsInterface("0x80ac58cd")).to.be.true
    })
    it("ERC721Metadata", async () => {
      const { testNFT } = await loadFixture(fixture)
      expect(await testNFT.supportsInterface("0x5b5e139f")).to.be.true
    })
    it("ERC165", async () => {
      const { testNFT } = await loadFixture(fixture)
      expect(await testNFT.supportsInterface("0x01ffc9a7")).to.be.true
    })
  })

})