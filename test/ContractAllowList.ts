import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";

const allowedAddressesLv0 = ['0x976EA74026E726554dB657fA54763abd0C3a0aa9', '0xe030EaDA1e2734356C4e170dCB8DA86B1F399482']
  .map(address => ethers.utils.getAddress(address))
const allowedAddressesLv1 = ['0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65']
  .map(address => ethers.utils.getAddress(address))

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
  // Contian owner for test
  const contractAllowList = await ContractAllowList.deploy([calGoverner.address, owner.getAddress()])
  await contractAllowList.deployed()

  const ContractAllowListProxy = await ethers.getContractFactory("ContractAllowListProxy")
  const contractAllowListProxy = await ContractAllowListProxy.deploy(contractAllowList.address)
  await contractAllowListProxy.deployed()

  timelock.grantRole(await timelock.EXECUTOR_ROLE(), calGoverner.address)
  timelock.grantRole(await timelock.PROPOSER_ROLE(), calGoverner.address)
  timelock.grantRole(await timelock.CANCELLER_ROLE(), calGoverner.address)

  for(const allowed of allowedAddressesLv0){
    await contractAllowList.connect(owner).addAllowed(allowed, 0);
  }
  
  for(const allowed of allowedAddressesLv1){
    await contractAllowList.connect(owner).addAllowed(allowed, 1);
  }

  const TestNFTcollection = await ethers.getContractFactory("TestNFTcollection")
  const testNFT = await TestNFTcollection.connect(owner).deploy()
  await testNFT.deployed()

  await testNFT.connect(owner).pause(false)
  await testNFT.connect(owner).setOnlyWhitelisted(false)
  await testNFT.connect(owner).setICAL(contractAllowList.address)

  return { calVoteToken, timelock, calGoverner, contractAllowList, contractAllowListProxy, testNFT }
}

describe("ContractAllowList", function () {
  const fixture = async () => {
    const [owner, admin, account, ...others] = await ethers.getSigners()
    const contracts = await deploy(owner)

    return { ...contracts, owner, admin, account, others }
  }

  describe("deploy", () => {
    it("各コントラクトがデプロイできること", async () => {
      const { calVoteToken, timelock, calGoverner, contractAllowList, contractAllowListProxy }
        = await loadFixture(fixture)
      console.log("CALVoteToken", calVoteToken.address)
      console.log("Timelock", timelock.address)
      console.log("CALGoverner", calGoverner.address)
      console.log("ContractAllowList", contractAllowList.address)
      console.log("contractAllowListProxy", contractAllowListProxy.address)
    })
  })

  describe("getAllowedList", () => {
    it("許可リストが取得できること", async () => {
      const { contractAllowList, account } = await loadFixture(fixture)
      expect(await contractAllowList.connect(account).getAllowedList(0)).to.deep.equals(allowedAddressesLv0)
      expect(await contractAllowList.connect(account).getAllowedList(1)).to.deep.equals(allowedAddressesLv1)
    })
  })

  describe("setApprovalAll", () => {
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
