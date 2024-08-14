import {Address, beginCell, Cell, storeMessage, toNano, Transaction} from "@ton/core";
import {
  Blockchain,
  internal,
  RemoteBlockchainStorage,
  SandboxContract,
  TreasuryContract,
  wrapTonClient4ForRemote
} from "@ton/sandbox";
import {
  collectCellStats,
  computedGeneric,
  computeFwdFees,
  computeFwdFeesVerbose,
  FullFees,
  MsgPrices,
  StorageStats
} from "./utils";
import '@ton/test-utils';
import {TokenLaunch} from '../wrappers/TokenLaunch';
import {TonClient4} from "@ton/ton";
import {Factory} from "@dedust/sdk";
import {getHttpV4Endpoint} from '@orbs-network/ton-access'
import {compile} from "@ton/blueprint";
import {Core} from "../wrappers/Core";


describe('TokenLaunch', () => {
  // VARIABLES
  let coreCode = new Cell();  // true code
  let core: SandboxContract<Core>;  // true code
  let tokenLaunchCode = new Cell();  // true code
  let tokenLaunch: SandboxContract<TokenLaunch>;
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  // TODO Build similar one after wrapper accomplishment
  // let userWallet: (address: Address) => Promise<SandboxContract<JettonWallet>>;
  let walletStats: StorageStats;
  let msgPrices: MsgPrices;
  let stateInitStats: StorageStats;
  let storageDuration: number;
  let defaultOverhead: bigint;

  // Dedust related variables
  let factory: SandboxContract<Factory>;

  // FUNCTIONS
  // TODO What is the purpose of ** instead of *?
  /**
   * Measures compute fees of a tx
   */
  let printTxGasStats: (name: string, trans: Transaction) => bigint;
  /**
   * Measures forward fees of a cell structure
   */
  let estimateBodyFee: (body: Cell, force_ref: boolean, prices?: MsgPrices) => FullFees;
  let estimateBurnFwd: (prices?: MsgPrices) => bigint;
  let forwardOverhead: (prices: MsgPrices, stats: StorageStats) => bigint;
  let calcSendFees: (send_fee: bigint,
                     recv_fee: bigint,
                     fwd_fee: bigint,
                     fwd_amount: bigint,
                     storage_fee: bigint,
                     state_init?: bigint) => bigint;

  beforeAll(async () => {
    coreCode = await compile("Core")
    tokenLaunchCode = await compile("TokenLaunch");

    blockchain = await Blockchain.create({
      storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(new TonClient4({
        endpoint: await getHttpV4Endpoint({network: "mainnet"}),
      })))
    })
    deployer = await blockchain.treasury('deployer');
    blockchain.now = Math.floor(Date.now() / 1000);

    core = blockchain.openContract(
      Core.createFromConfig(
        {
          chief: deployer.address,
          utilJettonMasterAddress: deployer.address,
          utilJettonWalletAddress: deployer.address,
          utilJetCurBalance: 0n,
          notFundedLaunches: null,
          notFundedLaunchesAmount: 0,
          launchConfig: {
            minTonForSaleSuccess: 0n,
            tonLimitForWlRound: 0n,
            utilJetRewardAmount: 0n,
            utilJetWlPassAmount: 0n,
            utilJetBurnPerWlPassAmount: 0n,
            jetWlLimitPct: 0,
            jetPubLimitPct: 0,
            jetDexSharePct: 0,
            creatorRoundDurationMs: 0,
            wlRoundDurationMs: 0,
            pubRoundDurationMs: 0,
          },
          contracts: {
            jettonLaunch: tokenLaunchCode,
            jettonLaunchUserVault: new Cell(),
            derivedJettonMaster: new Cell(),
            jettonWallet: new Cell()
          }
        },
        coreCode
      )
    )

    printTxGasStats = (name, transaction) => {
      const txComputed = computedGeneric(transaction);
      console.log(`${name} used ${txComputed.gasUsed} gas`);
      console.log(`${name} gas cost: ${txComputed.gasFees}`);
      return txComputed.gasFees;
    }

    estimateBodyFee = (body, forceRef, prices) => {
      // const curPrice = prices || msgPrices;
      const mockAddr = new Address(0, Buffer.alloc(32, 'A'));
      const testMsg = internal({
        from: mockAddr,
        to: mockAddr,
        value: toNano('1'),
        body
      });
      const packed = beginCell().store(storeMessage(testMsg, {forceRef})).endCell();
      const stats = collectCellStats(packed, [], true);
      return computeFwdFeesVerbose(prices || msgPrices, stats.cells, stats.bits);
    }

    // Jerks
    forwardOverhead = (prices, stats) => {
      // Meh, kinda lazy way of doing that, but tests are bloated enough already
      return computeFwdFees(prices, stats.cells, stats.bits) - prices.lumpPrice;
    }

    calcSendFees = (send, recv, fwd, fwd_amount, storage, state_init) => {
      const overhead = state_init || defaultOverhead;
      const fwdTotal = fwd_amount + (fwd_amount > 0n ? fwd * 2n : fwd) + overhead;
      // const execute = send + recv;
      return fwdTotal + send + recv + storage + 1n;
    }

    defaultOverhead = forwardOverhead(msgPrices, stateInitStats);
  })

  // TESTS
  it('should deploy', async () => {
    const deployResult = await core.sendDeploy({value: toNano('10'), via: deployer.getSender()});

    expect(deployResult.transactions).toHaveTransaction({
      from: deployer.address,
      to: core.address,
      deploy: true,
    });
    // Make sure it didn't bounce
    expect(deployResult.transactions).not.toHaveTransaction({
      on: deployer.address,
      from: core.address,
      inMessageBounced: true
    });
  });

  test('test DeDust', async () => {
    //   const scaleAddress = Address.parse("EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE");
    //   factory = blockchain.openContract(
    //     Factory.createFromAddress(MAINNET_FACTORY_ADDR)
    //   );
    //
    //   const scaleVaultAddress = await factory.getVaultAddress(Asset.jetton(scaleAddress));
    //   console.log(`$SCALE vault address: ${Address.normalize(scaleVaultAddress)}`);
    //
    //   await factory.sendCreateVault(deployer.getSender(), {
    //     asset: Asset.jetton(jettonMinter.address),
    //   });
    //
    //   const newVaultAddress = await factory.getVaultAddress(Asset.jetton(jettonMinter.address));
    //   console.log(`New vault address: ${Address.normalize(newVaultAddress)}`);
  });
})