import { Signer } from "ethers";
import { ethers } from "hardhat";

export const allowedAddressesLv1 = ['0x976EA74026E726554dB657fA54763abd0C3a0aa9', '0xe030EaDA1e2734356C4e170dCB8DA86B1F399482']
  .map(address => ethers.utils.getAddress(address))

export const allowedAddressesLv2 = ['0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65']
  .map(address => ethers.utils.getAddress(address))

export const allowedAddressesLocal = ['0x4Df74Aa88c771a82121A8F15b69505Edd5Ff8Aad']
  .map(address => ethers.utils.getAddress(address))


export const deploy = async (owner: Signer) => {
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

  for (const allowed of allowedAddressesLv1) {
    await contractAllowList.connect(owner).addAllowed(allowed, 1);
  }

  for (const allowed of allowedAddressesLv2) {
    await contractAllowList.connect(owner).addAllowed(allowed, 2);
  }

  const TestNFTcollection = await ethers.getContractFactory("TestNFTcollection")
  const testNFT = await TestNFTcollection.connect(owner).deploy(contractAllowList.address)
  await testNFT.deployed()
  
  const ExampleERC721PsiAntiScamWallet = await ethers.getContractFactory("ExampleERC721PsiAntiScamWallet")
  const exampleERC721Psi = await ExampleERC721PsiAntiScamWallet.connect(owner).deploy(contractAllowList.address)
  await exampleERC721Psi.deployed()

  for (const allowd of allowedAddressesLocal) {
    await testNFT.connect(owner).addLocalContractAllowList(allowd)
    await exampleERC721Psi.connect(owner).addLocalContractAllowList(allowd)
  }

  await testNFT.connect(owner).setCALLevel(0)
  await exampleERC721Psi.connect(owner).setCALLevel(0)

  const MarketDummy = await ethers.getContractFactory("MarketDummy")
  const market = await MarketDummy.connect(owner).deploy()
  await market.deployed()

  return { calVoteToken, timelock, calGoverner, contractAllowList, contractAllowListProxy, testNFT, exampleERC721Psi, market }
}

export default deploy