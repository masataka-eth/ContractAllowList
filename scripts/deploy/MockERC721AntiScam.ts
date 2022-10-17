import { ethers } from "hardhat"

async function main() {
  const ERC721AntiScam = await ethers.getContractFactory("MockERC721AntiScamControl")

  console.log('Deploying ERC721AntiScam token...')
  const token = await ERC721AntiScam.deploy()

  await token.deployed()
  console.log('Contract deployed to:', token.address)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
