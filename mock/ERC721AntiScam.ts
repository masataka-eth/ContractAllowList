import { addressToBuffer } from "@nomicfoundation/ethereumjs-evm/dist/opcodes";
import { loadFixture, time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { allowedAddressesLv0, allowedAddressesLv1, deploy } from "./deploy";


describe("ERC721AntiScam", function () {
  const fixture = async () => {
    const [owner, admin, account, ...others] = await ethers.getSigners()
    const contracts = await deploy(owner)

    return { ...contracts, owner, admin, account, others }
  }

  describe("isApprovedForAll", () => {
    it("setApprovalForAll実行後にロックを厳しくした場合にfalseになること", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv0[0], true))
        .not.to.be.reverted
      expect(await testNFT.isApprovedForAll(account.address, allowedAddressesLv0[0]))
        .to.equals(true)

      await testNFT.connect(owner).setContractLockStatus(3)
      expect(await testNFT.isApprovedForAll(account.address, allowedAddressesLv0[0]))
        .to.equals(false)
    })
  })

  describe("setApprovalForAll", () => {
    it("指定レベルの認可対象は成功すること", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv0[0], true))
        .not.to.be.reverted

      // TODO いまはエラーになる
      // await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })

    it("全レベルの認可対象外は失敗すること", async () => {
      const { testNFT, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(account.address, true))
        .to.be.reverted
    })

    it("指定レベルに含まない認可対象外は失敗すること", async () => {
      const { testNFT, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .to.be.reverted
    })

    it("指定レベルをあげれば成功すること", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setContractAllowListLevel(1);
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted
    })
  })

  describe("CALの設定と変更のテスト", () => {
    it("ownerであればCALを後から変更できる", async () => {
      const { testNFT, market, owner, account } = await loadFixture(fixture)

      const NewTimelock = await ethers.getContractFactory("Timelock")
      const newTimelock = await NewTimelock.deploy(2, [ethers.constants.AddressZero], [ethers.constants.AddressZero])
      await newTimelock.deployed()

      const NewContractAllowList = await ethers.getContractFactory("ContractAllowList")
      // Contian owner for test
      const newContractAllowList = await NewContractAllowList.deploy([newTimelock.address, owner.getAddress()])
      await newContractAllowList.deployed()

      const NewContractAllowListProxy = await ethers.getContractFactory("ContractAllowListProxy")
      const newContractAllowListProxy = await NewContractAllowListProxy.deploy(newContractAllowList.address)
      await newContractAllowListProxy.deployed()

      // ownerはCALを設定できる
      await expect(testNFT.connect(owner).setCAL(newContractAllowListProxy.address))
        .not.to.be.reverted
      let gotCAL = await testNFT.CAL()
      await expect(gotCAL).to.equals(newContractAllowListProxy.address)

      // owner以外はCALを設定できない
      await expect(testNFT.connect(account).setCAL(newContractAllowListProxy.address)).to.be.revertedWith('Ownable: caller is not the owner')

      // ownerは0x000...を設定できる
      await expect(testNFT.connect(owner).setCAL("0x0000000000000000000000000000000000000000"))
        .not.to.be.reverted
      gotCAL = await testNFT.CAL()
      await expect(gotCAL).to.equals("0x0000000000000000000000000000000000000000")

    })

    it("CALが0アドレスでもLocalだけで動く", async () => {
      const { testNFT, market, owner, account } = await loadFixture(fixture)

      // ownerは0x000...を設定できる
      await expect(testNFT.connect(owner).setCAL("0x0000000000000000000000000000000000000000"))
        .not.to.be.reverted

      // LockStatusをUnlockに設定するとエラーにならず動く
      await expect(testNFT.connect(owner).setContractLockStatus(1))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted


      // LockStatusをCalLockに設定するとLocalAllowListに設定されていなければエラー
      await expect(testNFT.connect(owner).setContractLockStatus(2))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv0[0], true))
        .to.be.revertedWith('Can not approve locked token')

      // LockStatusをCalLockに設定するとLocalAllowListに設定されていればエラーにならず動く
      await expect(testNFT.connect(owner).addLocalContractAllowList(allowedAddressesLv0[0]))
        .not.to.be.reverted

      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv0[0], true))
        .not.to.be.reverted

      // LockStatusがCalLockの状態でLocalAllowListから削除すると再びエラー
      await expect(testNFT.connect(owner).removeLocalContractAllowList(allowedAddressesLv0[0]))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv0[0], true))
        .to.be.revertedWith('Can not approve locked token')

      // AllLockに設定するとLocalAllowListに設定されていてもエラー
      await expect(testNFT.connect(owner).setContractLockStatus(3))
        .not.to.be.reverted
      await expect(testNFT.connect(owner).addLocalContractAllowList(allowedAddressesLv0[0]))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv0[0], true))
        .to.be.revertedWith('Can not approve locked token')

    })


  })
})