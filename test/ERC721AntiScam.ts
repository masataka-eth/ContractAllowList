import { loadFixture, time, mine } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { allowedAddressesLv1, allowedAddressesLv2, deploy } from "./deploy";


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
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted

      expect(await testNFT.isApprovedForAll(account.address, allowedAddressesLv1[0]))
        .to.equals(true)

      await testNFT.connect(owner).setContractLockStatus(2)
      expect(await testNFT.isApprovedForAll(account.address, allowedAddressesLv1[0]))
        .to.equals(false)
    })
  })

  describe("setApprovalForAll", () => {
    it("指定レベルの認可対象は成功すること", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted

      await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })

    it("全レベルの認可対象外は失敗すること", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await expect(testNFT.connect(account).setApprovalForAll(account.address, true))
        .to.be.reverted
    })

    it("指定レベルに含まない認可対象外は失敗すること", async () => {
      const { testNFT, account,owner } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv2[0], true))
        .to.be.reverted
    })

    it("指定レベルをあげれば成功すること", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(2);
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv2[0], true))
        .not.to.be.reverted
      await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted
    })
  })

  describe("approve", () => {
    it("ContractLock=ALLLock,WalletLock=ALLLock,TokenLock=Unlock is success", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(2); //ALLLock
      await testNFT.connect(account).lockWallet(); //ALLLock
      await testNFT.connect(account).unlock([0]); //Unlock
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .not.to.be.reverted
    })

    it("ContractLock=Unlock,WalletLock=Unlock,TokenLock=CALLock is failure", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(1); //UnLLock
      await testNFT.connect(account).unlockWallet(); //UnSet
      await testNFT.connect(account).unlock([0]); //UnSet
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .to.be.reverted
    })
    
    it("ContractLock=ALLLock,WalletLock=ALLLock,TokenLock=CALLock,allowedAddress is success", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(2); //UnLLock
      await testNFT.connect(account).unlockWallet(); //UnLock
      await testNFT.connect(account).unlock([0]); //Unlock
      await expect(testNFT.connect(account).approve(allowedAddressesLv1[0], 0))
        .not.to.be.reverted
    })

    it("ContractLock=Unlock,WalletLock=Unlock,TokenLock=ALLLock is failure", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(1); //Unlock
      await testNFT.connect(account).unlockWallet(); //UnLock
      await testNFT.connect(account).lock([0]); //Unlock
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .to.be.reverted
    })
    
    it("ContractLock=ALLLock,WalletLock=Unlock,TokenLock=UnSet is success", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(2); //Unlock
      await testNFT.connect(account).unlockWallet(); //UnLock
      await testNFT.connect(account).lock([0]); //Unlock
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .not.to.be.reverted
    })

    it("ContractLock=Unlock,WalletLock=CALLock,TokenLock=UnSet is failure", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(1); //Unlock
      await testNFT.connect(account).unlockWallet(); //UnLock
      await testNFT.connect(account).lock([0]); //Unlock
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .to.be.reverted
    })

    it("ContractLock=ALLLock,WalletLock=CALLock,TokenLock=UnSet,allowedAddress is success", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(3); //ALLLock
      await testNFT.connect(account).setWalletLock(2); //CALLock
      await testNFT.connect(account).setLock(0,0); //UnSet
      await expect(testNFT.connect(account).approve(allowedAddressesLv1[0], 0))
        .not.to.be.reverted
    })

    it("ContractLock=Unlock,WalletLock=ALLLock,TokenLock=UnSet is failure", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(1); //Unlock
      await testNFT.connect(account).setWalletLock(3); //ALLLock
      await testNFT.connect(account).setLock(0,0); //UnSet
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .to.be.reverted
    })

    it("ContractLock=Unlock,WalletLock=UnSet,TokenLock=UnSet is success", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(1); //Unlock
      await testNFT.connect(account).setWalletLock(0); //UnSet
      await testNFT.connect(account).setLock(0,0); //UnSet
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .not.to.be.reverted
    })

    it("ContractLock=CALLock,WalletLock=UnSet,TokenLock=UnSet is failure", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(2); //CALLock
      await testNFT.connect(account).setWalletLock(0); //UnSet
      await testNFT.connect(account).setLock(0,0); //UnSet
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .to.be.reverted
    })

    it("ContractLock=CALLock,WalletLock=UnSet,TokenLock=UnSet,allowedAddress is success", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(2); //CALLock
      await testNFT.connect(account).setWalletLock(0); //UnSet
      await testNFT.connect(account).setLock(0,0); //UnSet
      await expect(testNFT.connect(account).approve(allowedAddressesLv1[0], 0))
        .not.to.be.reverted
    })

    it("ContractLock=ALLLock,WalletLock=UnSet,TokenLock=UnSet is failure", async () => {
      const { testNFT, account ,owner} = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await testNFT.connect(owner).setCalLevel(1);  //level 0は全拒否
      await testNFT.connect(owner).setContractLockStatus(3); //ALLLock
      await testNFT.connect(account).setWalletLock(0); //UnSet
      await testNFT.connect(account).setLock(0,0); //UnSet
      await expect(testNFT.connect(account).approve(owner.address, 0))
        .to.be.reverted
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
      await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 0)).not.to.be.reverted


      // LockStatusをCalLockに設定するとLocalAllowListに設定されていなければエラー
      await expect(testNFT.connect(owner).setContractLockStatus(2))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .to.be.revertedWith('Can not approve locked token')

      // LockStatusをCalLockに設定するとLocalAllowListに設定されていればエラーにならず動く
      await expect(testNFT.connect(owner).addLocalContractAllowList(allowedAddressesLv1[0]))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .not.to.be.reverted
      await expect(testNFT.connect(account)["safeTransferFrom(address,address,uint256)"](account.address, owner.address, 2)).not.to.be.reverted

      // LockStatusがCalLockの状態でLocalAllowListから削除すると再びエラー
      await expect(testNFT.connect(owner).removeLocalContractAllowList(allowedAddressesLv1[0]))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .to.be.revertedWith('Can not approve locked token')

      // AllLockに設定するとLocalAllowListに設定されていてもエラー
      await expect(testNFT.connect(owner).setContractLockStatus(3))
        .not.to.be.reverted
      await expect(testNFT.connect(owner).addLocalContractAllowList(allowedAddressesLv1[0]))
        .not.to.be.reverted

      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })
      await expect(testNFT.connect(account).setApprovalForAll(allowedAddressesLv1[0], true))
        .to.be.revertedWith('Can not approve locked token')

    })


  })

  describe("Event", () => {
    it("_lock実行時にEventが発行されること", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })

      // 所有者によるロックイベント
      await expect(testNFT.connect(account).lock(0))
            .to.emit(testNFT, 'TokenLock')
            .withArgs(account.address, account.address, 1, 0)        
    })
  })

  describe("Interface of getTokensUnderLock", () =>{
    it("getTokensUnderLockが長さ0の配列を返すこと", async () => {
      const { testNFT, owner, account } = await loadFixture(fixture)
      await testNFT.connect(account).mint(1, { value: ethers.utils.parseEther("1") })

      let res = await testNFT.connect(account)["getTokensUnderLock(address)"](account.address);
      expect(res.length).to.be.equal(0)

      res = await testNFT.connect(account)["getTokensUnderLock(address,address)"](account.address, account.address);
      expect(res.length).to.be.equal(0)

      res = await testNFT.connect(account)["getTokensUnderLock(address,uint256,uint256)"](
        account.address, 
        1,
        10);
      expect(res.length).to.be.equal(0)

      res = await testNFT.connect(account)["getTokensUnderLock(address,address,uint256,uint256)"](
        account.address, 
        account.address,
        1,
        10);
      expect(res.length).to.be.equal(0)

    })
  })

})