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
      const { testNFT, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv0[0], true))
        .not.to.be.reverted
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
})