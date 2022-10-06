import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

const deploy = async (owner: Signer) => {
  const CALVoteToken = await ethers.getContractFactory("CALVoteToken")
  const calVoteToken = await CALVoteToken.deploy()
  await calVoteToken.deployed()

  const Timelock = await ethers.getContractFactory("Timelock")
  const timelock = await Timelock.deploy(2, [ethers.constants.AddressZero], [ethers.constants.AddressZero])
  await timelock.deployed()

  const CALGoverner = await ethers.getContractFactory("CALGoverner")
  const calGoverner = await CALGoverner.deploy(calVoteToken.address, timelock.address)
  await calGoverner.deployed()

  const ContractAllowList = await ethers.getContractFactory("ContractAllowList")
  const contractAllowList = await ContractAllowList.deploy(calGoverner.address)
  await contractAllowList.deployed()

  timelock.grantRole(await timelock.EXECUTOR_ROLE(), calGoverner.address)
  timelock.grantRole(await timelock.PROPOSER_ROLE(), calGoverner.address)
  timelock.grantRole(await timelock.CANCELLER_ROLE(), calGoverner.address)

  const TestNFTcollection = await ethers.getContractFactory("TestNFTcollection")
  const testNFT = await TestNFTcollection.connect(owner).deploy()
  await testNFT.deployed()

  testNFT.connect(owner).pause(false)
  testNFT.connect(owner).setOnlyWhitelisted(false)
  testNFT.connect(owner).setICAL(contractAllowList.address)

  return { calVoteToken, timelock, calGoverner, contractAllowList, testNFT }
}

describe("ContractAllowList", function () {
  const fixture = async () => {
    const [owner, admin, account, ...others] = await ethers.getSigners()
    const contracts = await deploy(owner)

    return { ...contracts, owner, admin, account, others }
  }

  describe("deploy", () => {
    it("各コントラクトがデプロイできること", async () => {
      const { calVoteToken, timelock, calGoverner, contractAllowList } = await loadFixture(fixture)
      console.log("CALVoteToken", calVoteToken.address)
      console.log("Timelock", timelock.address)
      console.log("CALGoverner", calGoverner.address)
      console.log("ContractAllowList", contractAllowList.address)
    })
  })

  describe("setApprovalAll", () => {
    it("認可対象は成功すること", async () => {
      const { testNFT, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(ethers.utils.getAddress("0x53b7a2bF95cB4f00c98b115d13c6B6D1483472E3"), true))
        .not.to.be.reverted
    })
    
    it("認可対象外は失敗すること", async () => {
      const { testNFT, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(account.address, true))
        .to.be.reverted
    })
  })
})
