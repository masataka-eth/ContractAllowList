import { loadFixture, time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { allowedAddressesLv1, allowedAddressesLv2, allowedAddressesLocal, deploy } from "./deploy";


describe("AntiScamWallet with ERC721Psi", function () {
  const fixture = async () => {
    const [owner, admin, account, ...others] = await ethers.getSigners()
    const contracts = await deploy(owner)

    await contracts.contractAllowList.connect(owner).addAllowed(owner.address, 1)

    return { ...contracts, owner, admin, account, others }
  }

  
  const UnSet = 0
  const UnLock = 1
  const Lock = 2


  describe("isApprovedForAll", () => {
    it("CAL=1にてsetApprovalForAllでtrueを付与し、isApprovedForAllがtrueを確認", async () => {
      const { exampleERC721Psi, owner, account } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted
      expect(await exampleERC721Psi.isApprovedForAll(account.address, allowedAddressesLv1[0]))
        .to.equals(true)
    })

    it("CAL=2でsetApprovalForAll実行後、Lv1にした場合にfalseになること", async () => {
      const { exampleERC721Psi, owner, account } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await exampleERC721Psi.connect(owner).setCALLevel(2);  //level 0は全拒否
      expect(await exampleERC721Psi.CALLevel()).to.be.equal(2);
      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLv2[0], true))
        .not.to.be.reverted

      await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
      expect(await exampleERC721Psi.isApprovedForAll(account.address, allowedAddressesLv2[0]))
        .to.equals(false)
    })

    it("CAL=1にてsetApprovalForAllでtrueを付与後、contractLockでLock設定するとisApprovedForAllがfalseになる", async () => {
      const { exampleERC721Psi, owner, account } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
      await exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLv1[0], true)
      await exampleERC721Psi.connect(owner).setContractLock(Lock)
      expect(await exampleERC721Psi.isApprovedForAll(account.address, allowedAddressesLv1[0]))
        .to.equals(false)
    })

  })

  describe("setApprovalForAll", () => {
    it("指定レベルの認可対象は成功すること", async () => {
      const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted

      await expect(exampleERC721Psi.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })

    it("全レベルの認可対象外は失敗すること", async () => {
      const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
      await expect(exampleERC721Psi.connect(account).setApprovalForAll(account.address, true))
        .to.be.reverted
    })

    it("指定レベルに含まない認可対象外は失敗すること", async () => {
      const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLv2[0], true))
        .to.be.reverted
    })

    it("指定レベルをあげれば成功すること", async () => {
      const { exampleERC721Psi, owner, account } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await exampleERC721Psi.connect(owner).setCALLevel(2);
      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLv2[0], true))
        .not.to.be.reverted
      await expect(exampleERC721Psi.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })
  })

  describe("approve", () => {
    describe("success", () => {
      it("DefaultLock = Lock, WalletLock = UnLock, ContractLock = UnLock is succes", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(Lock);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnLock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .not.to.be.reverted
      })

      it("DefaultLock = UnLock, WalletLock = UnSet, ContractLock = UnLock is success", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(UnLock);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnSet);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .not.to.be.reverted
      })

      it("DefaultLock = UnLock, WalletLock = UnLock, ContractLock = UnLock is success", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(UnLock);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnLock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .not.to.be.reverted
      })
    })

    describe("failure", () => {
      it("DefaultLock = Lock, WalletLock = Lock, ContractLock = UnLock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(Lock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, Lock);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = Lock, WalletLock = UnSet, ContractLock = UnLock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(Lock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnSet);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = UnLock, WalletLock = Lock, ContractLock = UnLock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(UnLock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, Lock);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = Lock, WalletLock = Lock, ContractLock = Lock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(Lock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, Lock);
        await exampleERC721Psi.connect(owner).setContractLock(Lock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = Lock, WalletLock = UnLock, ContractLock = Lock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(Lock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnLock);
        await exampleERC721Psi.connect(owner).setContractLock(Lock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = Lock, WalletLock = UnSet, ContractLock = Lock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(Lock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnSet);
        await exampleERC721Psi.connect(owner).setContractLock(Lock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = UnLock, WalletLock = Lock, ContractLock = Lock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(UnLock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, Lock);
        await exampleERC721Psi.connect(owner).setContractLock(Lock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = UnLock, WalletLock = UnLock, ContractLock = Lock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(UnLock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnLock);
        await exampleERC721Psi.connect(owner).setContractLock(Lock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = UnLock, WalletLock = UnSet, ContractLock = Lock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(UnLock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnSet);
        await exampleERC721Psi.connect(owner).setContractLock(Lock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = Lock, WalletLock = Lock, ContractLock = UnLock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(Lock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, Lock);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = UnLock, WalletLock = Lock, ContractLock = UnLock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(UnLock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, Lock);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

      it("DefaultLock = Lock, WalletLock = UnSet, ContractLock = UnLock is failure", async () => {
        const { exampleERC721Psi, account, owner } = await loadFixture(fixture)
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
        await exampleERC721Psi.connect(owner).setCALLevel(1);  //level 0は全拒否
        await exampleERC721Psi.connect(owner).setDefaultLock(Lock);
        await exampleERC721Psi.connect(account).setWalletLock(account.address, UnSet);
        await exampleERC721Psi.connect(owner).setContractLock(UnLock);
        await expect(exampleERC721Psi.connect(account).approve(owner.address, 0))
          .to.be.reverted
      })

    })
  })

  describe("CALの設定と変更のテスト", () => {
    it("ownerであればCALを後から変更できる", async () => {
      const { exampleERC721Psi, market, owner, account } = await loadFixture(fixture)

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
      await expect(exampleERC721Psi.connect(owner).setCAL(newContractAllowListProxy.address))
        .not.to.be.reverted
      let gotCAL = await exampleERC721Psi.CAL()
      expect(gotCAL).to.equals(newContractAllowListProxy.address)

      // owner以外はCALを設定できない
      await expect(exampleERC721Psi.connect(account).setCAL(newContractAllowListProxy.address)).to.be.reverted

      // ownerは0x000...を設定できる
      await expect(exampleERC721Psi.connect(owner).setCAL(ethers.constants.AddressZero))
        .not.to.be.reverted
      gotCAL = await exampleERC721Psi.CAL()
      expect(gotCAL).to.equals(ethers.constants.AddressZero)

    })

    it("CALが0アドレスでもLocalだけで動く", async () => {
      const { exampleERC721Psi, market, owner, account } = await loadFixture(fixture)

      // ownerは0x000...を設定できる
      await expect(exampleERC721Psi.connect(owner).setCAL(ethers.constants.AddressZero))
        .not.to.be.reverted
        await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLocal[0], true))
        .not.to.be.reverted
      await expect(exampleERC721Psi.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })

    it("LocalCALの追加と削除", async () => {
      const { exampleERC721Psi, market, owner, account } = await loadFixture(fixture)
      
      expect((await exampleERC721Psi.connect(owner).getLocalContractAllowList())[0]).to.equal(allowedAddressesLocal[0])

      // 削除
      expect(await exampleERC721Psi.connect(owner).removeLocalContractAllowList(allowedAddressesLocal[0])).to.be.ok

      expect((await exampleERC721Psi.connect(account).getLocalContractAllowList()).length).to.equal(0)

      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLocal[0], true))
        .to.be.reverted

      // 追加
      expect(await exampleERC721Psi.connect(owner).addLocalContractAllowList(allowedAddressesLocal[0])).to.be.ok

      const allowedAddressesLocal2 = ethers.utils.getAddress('0x0dAE5FcaD0DF8E5C029D76927582DFBdFd7eeC79')

      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLocal2, true))
        .to.be.reverted

      expect(await exampleERC721Psi.connect(owner).addLocalContractAllowList(allowedAddressesLocal2)).to.be.ok

      await expect(exampleERC721Psi.connect(account).setApprovalForAll(allowedAddressesLocal2, true))
        .not.to.be.reverted
      await expect(exampleERC721Psi.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted

      const localContractAllowList = await exampleERC721Psi.connect(account).getLocalContractAllowList()
      expect(localContractAllowList.length).to.equal(2)
      expect(localContractAllowList[0]).to.equal(allowedAddressesLocal[0])
      expect(localContractAllowList[1]).to.equal(allowedAddressesLocal2)

    })

  })


  describe("Event", () => {
    /*
    it("ロックステータス変更時にEventが発行されること: Lock", async () => {
      const { exampleERC721Psi, owner, account } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })

      // 所有者によるロックイベント
      await expect(exampleERC721Psi.connect(account).setTokenLock([0], Lock))
        .to.emit(exampleERC721Psi, 'TokenLock')
        .withArgs(account.address, account.address, 2, 0)
    })

    it("ロックステータス変更時にEventが発行されること: UnLock", async () => {
      const { exampleERC721Psi, owner, account } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })

      // 所有者によるロックイベント
      await expect(exampleERC721Psi.connect(account).setTokenLock([0], UnLock))
        .to.emit(exampleERC721Psi, 'TokenLock')
        .withArgs(account.address, account.address, 1, 0)
    })

    it("ロックステータス変更時にEventが発行されること: UnSet", async () => {
      const { exampleERC721Psi, owner, account } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(1, { value: ethers.utils.parseEther("1") })

      // 所有者によるロックイベント
      await expect(exampleERC721Psi.connect(account).setTokenLock([0], UnSet))
        .to.emit(exampleERC721Psi, 'TokenLock')
        .withArgs(account.address, account.address, 0, 0)
    })
    */
  })

  /*
  describe("Interface of getTokensUnderLock", () => {
    it("getTokensUnderLockが長さ0の配列を返すこと", async () => {
      const { exampleERC721Psi, owner, account } = await loadFixture(fixture)
      await exampleERC721Psi.connect(account).mint(10, { value: ethers.utils.parseEther("1") })
      await exampleERC721Psi.connect(owner).mint(10, { value: ethers.utils.parseEther("1") })

      expect(await exampleERC721Psi["getTokensUnderLock()"]()).to.deep.equals([])
      expect(await exampleERC721Psi["getTokensUnderLock(uint256,uint256)"](0, 5)).to.deep.equals([]);

      // token lock
      await exampleERC721Psi.connect(account).setTokenLock([1, 2, 3, 5, 6], Lock)
      expect(await exampleERC721Psi["getTokensUnderLock()"]()).to.deep.equals([1, 2, 3, 5, 6])
      expect(await exampleERC721Psi["getTokensUnderLock(uint256,uint256)"](3, 5)).to.deep.equals([3, 5]);

      // wallet lock
      await exampleERC721Psi.connect(account).setWalletLock(account.address, Lock)
      expect(await exampleERC721Psi["getTokensUnderLock()"]()).to.deep.equals([...Array(10)].map((_, i) => i))
      expect(await exampleERC721Psi["getTokensUnderLock(uint256,uint256)"](3, 5)).to.deep.equals([3, 4, 5]);

      // contract lock
      await exampleERC721Psi.connect(account).setWalletLock(account.address, UnSet)
      await exampleERC721Psi.connect(owner).setContractLock(Lock)
      expect(await exampleERC721Psi["getTokensUnderLock()"]()).to.deep.equals([...Array(20)].map((_, i) => i))
      expect(await exampleERC721Psi["getTokensUnderLock(uint256,uint256)"](9, 11)).to.deep.equals([9, 10, 11]);
    })
  })
  */

  describe("supportsInterfaces", () => {
    it("ERC721", async () => {
      const { exampleERC721Psi } = await loadFixture(fixture)
      expect(await exampleERC721Psi.supportsInterface("0x80ac58cd")).to.be.true
    })
    it("ERC721Metadata", async () => {
      const { exampleERC721Psi } = await loadFixture(fixture)
      expect(await exampleERC721Psi.supportsInterface("0x5b5e139f")).to.be.true
    })
    it("ERC165", async () => {
      const { exampleERC721Psi } = await loadFixture(fixture)
      expect(await exampleERC721Psi.supportsInterface("0x01ffc9a7")).to.be.true
    })
  })

})