import { loadFixture, time, mine } from "@nomicfoundation/hardhat-network-helpers";
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
  const contractAllowList = await ContractAllowList.deploy([timelock.address, owner.getAddress()])
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

  describe("addAllowed + removeAllowed", () => {
    it("許可リストレベル超えた追加ができること", async () => {
      const { contractAllowList, owner,account } = await loadFixture(fixture)
      expect(await contractAllowList.connect(account).getAllowedList(0)).to.deep.equals(allowedAddressesLv0)
      expect(await contractAllowList.connect(account).getAllowedList(1)).to.deep.equals(allowedAddressesLv1)
      expect(await contractAllowList.connect(account).getAllowedList(2)).to.deep.equals([])
      expect(await contractAllowList.connect(account).maxLevel()).to.equals(1);

      await contractAllowList.connect(owner).addAllowed("0x90F79bf6EB2c4f870365E785982E1f101E93b906",2);
      expect(await contractAllowList.connect(account).getAllowedList(2)).to.deep.equals(["0x90F79bf6EB2c4f870365E785982E1f101E93b906"])
      expect(await contractAllowList.connect(account).maxLevel()).to.equals(2);

      await contractAllowList.connect(owner).removeAllowed("0x90F79bf6EB2c4f870365E785982E1f101E93b906",2);
      expect(await contractAllowList.connect(account).getAllowedList(2)).to.deep.equals([])
      expect(await contractAllowList.connect(account).maxLevel()).to.equals(1);
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

  describe("governor", () => {
    const VOTE_AGAINST = 0
    const VOTE_FOR = 1
    const VOTE_ABSTAIN = 2

    const PROPOSAL_STATE_PENDING = 0
    const PROPOSAL_STATE_ACTIVE = 1
    const PROPOSAL_STATE_CANCELED = 2
    const PROPOSAL_STATE_DEFEATED = 3
    const PROPOSAL_STATE_SUCCEEDED = 4
    const PROPOSAL_STATE_QUEUED = 5
    const PROPOSAL_STATE_EXPIRED = 6
    const PROPOSAL_STATE_EXECUTED = 7

    it("認可対象の追加提案が可決され、追加できること", async () => {
      const { calGoverner, calVoteToken, contractAllowList, owner, account, others } = await loadFixture(fixture)
      const [proposalTarget, voter1, voter2, voter3] = others
      const proposalCallData = contractAllowList.interface.encodeFunctionData('addAllowed', [proposalTarget.address, 1])

      for (const voter of [voter1, voter2, voter3]) {
        // delegateをしておかないと投票力が0になる。
        await calVoteToken.connect(voter).delegate(voter.address)
        await calVoteToken.connect(voter).mint()
      }

      const proposalTx = await calGoverner.connect(voter1).propose([contractAllowList.address], [0], [proposalCallData], "Proposal #1: add allowed address to level1 list")
      const receipt = await proposalTx.wait()

      const eventOfProposalCreated = receipt.events?.filter(r => r.event == "ProposalCreated").at(0)?.args!
      const proposalId = eventOfProposalCreated[0]

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_PENDING)

      // wait voting delay
      await mine(1)

      for (const voter of [voter1, voter2, voter3]) {
        await expect(calGoverner.connect(voter).castVote(proposalId, VOTE_FOR)).not.to.be.reverted
      }

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_ACTIVE)

      // wait deadline
      await mine(45836)

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_SUCCEEDED)

      const descriptionHash = ethers.utils.id("Proposal #1: add allowed address to level1 list")
      await expect(calGoverner.connect(voter1).queue([contractAllowList.address], [0], [proposalCallData], descriptionHash))
        .not.to.be.reverted
      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_QUEUED)

      
      await time.increase(45836)
      
      expect(await contractAllowList.getAllowedList(1)).not.to.be.contains(proposalTarget.address)

      await expect(calGoverner.connect(voter1).execute([contractAllowList.address], [0], [proposalCallData], descriptionHash))
        .not.to.be.reverted
      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_EXECUTED)

      expect(await contractAllowList.getAllowedList(1)).to.be.contains(proposalTarget.address)
    })

    it("認可対象の追加提案が否決され、追加されないこと", async () => {
      const { calGoverner, calVoteToken, contractAllowList, owner, account, others } = await loadFixture(fixture)
      const [proposalTarget, voter1, voter2, voter3] = others
      const proposalCallData = contractAllowList.interface.encodeFunctionData('addAllowed', [proposalTarget.address, 1])

      for (const voter of [voter1, voter2, voter3]) {
        // delegateをしておかないと投票力が0になる。
        await calVoteToken.connect(voter).delegate(voter.address)
        await calVoteToken.connect(voter).mint()
      }

      const proposalTx = await calGoverner.connect(voter1).propose([contractAllowList.address], [0], [proposalCallData], "Proposal #1: add allowed address to level1 list")
      const receipt = await proposalTx.wait()

      const eventOfProposalCreated = receipt.events?.filter(r => r.event == "ProposalCreated").at(0)?.args!
      const proposalId = eventOfProposalCreated[0]

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_PENDING)

      // wait voting delay
      await mine(1)

      for (const voter of [voter1, voter2, voter3]) {
        await expect(calGoverner.connect(voter).castVote(proposalId, VOTE_AGAINST)).not.to.be.reverted
      }

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_ACTIVE)

      // wait deadline
      await mine(45836)

      // against fix
      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_DEFEATED)
      expect(await contractAllowList.getAllowedList(1)).not.to.be.contains(proposalTarget.address)
    })

    it("認可対象の追加提案3票集まり多数であれば、追加されること", async () => {
      const { calGoverner, calVoteToken, contractAllowList, owner, account, others } = await loadFixture(fixture)
      const [proposalTarget, voter1, voter2, voter3] = others
      const proposalCallData = contractAllowList.interface.encodeFunctionData('addAllowed', [proposalTarget.address, 1])

      for (const voter of [voter1, voter2, voter3]) {
        // delegateをしておかないと投票力が0になる。
        await calVoteToken.connect(voter).delegate(voter.address)
        await calVoteToken.connect(voter).mint()
      }

      const proposalTx = await calGoverner.connect(voter1).propose([contractAllowList.address], [0], [proposalCallData], "Proposal #1: add allowed address to level1 list")
      const receipt = await proposalTx.wait()

      const eventOfProposalCreated = receipt.events?.filter(r => r.event == "ProposalCreated").at(0)?.args!
      const proposalId = eventOfProposalCreated[0]

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_PENDING)

      // wait voting delay
      await mine(1)

      for (const voter of [voter1, voter2]) {
        await expect(calGoverner.connect(voter).castVote(proposalId, VOTE_FOR)).not.to.be.reverted
      }
      await expect(calGoverner.connect(voter3).castVote(proposalId, VOTE_AGAINST)).not.to.be.reverted

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_ACTIVE)

      // wait deadline
      await mine(45836)

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_SUCCEEDED)

      const descriptionHash = ethers.utils.id("Proposal #1: add allowed address to level1 list")
      await expect(calGoverner.connect(voter1).queue([contractAllowList.address], [0], [proposalCallData], descriptionHash))
        .not.to.be.reverted
      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_QUEUED)

      
      await time.increase(45836)
      
      expect(await contractAllowList.getAllowedList(1)).not.to.be.contains(proposalTarget.address)

      await expect(calGoverner.connect(voter1).execute([contractAllowList.address], [0], [proposalCallData], descriptionHash))
        .not.to.be.reverted
      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_EXECUTED)

      expect(await contractAllowList.getAllowedList(1)).to.be.contains(proposalTarget.address)
    })
    it("認可対象の追加提案2票、反対1票でも3票集まってるので、追加されること", async () => {
      const { calGoverner, calVoteToken, contractAllowList, owner, account, others } = await loadFixture(fixture)
      const [proposalTarget, voter1, voter2, voter3] = others
      const proposalCallData = contractAllowList.interface.encodeFunctionData('addAllowed', [proposalTarget.address, 1])

      for (const voter of [voter1, voter2, voter3]) {
        // delegateをしておかないと投票力が0になる。
        await calVoteToken.connect(voter).delegate(voter.address)
        await calVoteToken.connect(voter).mint()
      }

      const proposalTx = await calGoverner.connect(voter1).propose([contractAllowList.address], [0], [proposalCallData], "Proposal #1: add allowed address to level1 list")
      const receipt = await proposalTx.wait()

      const eventOfProposalCreated = receipt.events?.filter(r => r.event == "ProposalCreated").at(0)?.args!
      const proposalId = eventOfProposalCreated[0]

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_PENDING)

      // wait voting delay
      await mine(1)

      for (const voter of [voter1, voter2]) {
        await expect(calGoverner.connect(voter).castVote(proposalId, VOTE_FOR)).not.to.be.reverted
      }
      await expect(calGoverner.connect(voter3).castVote(proposalId, VOTE_AGAINST)).not.to.be.reverted

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_ACTIVE)

      // wait deadline
      await mine(45836)

      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_SUCCEEDED)

      const descriptionHash = ethers.utils.id("Proposal #1: add allowed address to level1 list")
      await expect(calGoverner.connect(voter1).queue([contractAllowList.address], [0], [proposalCallData], descriptionHash))
        .not.to.be.reverted
      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_QUEUED)

      
      await time.increase(45836)
      
      expect(await contractAllowList.getAllowedList(1)).not.to.be.contains(proposalTarget.address)

      await expect(calGoverner.connect(voter1).execute([contractAllowList.address], [0], [proposalCallData], descriptionHash))
        .not.to.be.reverted
      expect(await calGoverner.state(proposalId)).to.equals(PROPOSAL_STATE_EXECUTED)

      expect(await contractAllowList.getAllowedList(1)).to.be.contains(proposalTarget.address)
    })
  })
})
