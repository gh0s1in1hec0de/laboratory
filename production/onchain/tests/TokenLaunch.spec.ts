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
import {TokenLaunch} from '../wrappers/TokenLaunch';
import {TonClient4} from "@ton/ton";
import {Factory} from "@dedust/sdk";
import {getHttpV4Endpoint} from '@orbs-network/ton-access'


describe('TokenLaunch', () => {
  // VARIABLES
  let tokenLaunchCodeRaw = new Cell();  // true code
  let tokenLaunchCode = new Cell();     // library cell with reference to tokenLaunchCodeRaw
  let blockchain: Blockchain;
  let deployer: SandboxContract<TreasuryContract>;
  let tokenLaunch: SandboxContract<TokenLaunch>;
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
    // tokenLaunchCodeRaw = await compile('TokenLaunch');
    blockchain = await Blockchain.create({
      storage: new RemoteBlockchainStorage(wrapTonClient4ForRemote(new TonClient4({
        endpoint: await getHttpV4Endpoint({network: "mainnet"}),
      })))
    })
    deployer = await blockchain.treasury('deployer');
    blockchain.now = Math.floor(Date.now() / 1000);

    // TODO Build similar one after wrapper accomplishment
    // jettonMinter = blockchain.openContract(
    //   JettonMinter.createFromConfig(
    //     {
    //       admin: deployer.address,
    //       wallet_code: jwallet_code,
    //       jetton_content: jettonContentToCell(defaultContent)
    //     },
    //     minter_code
    //   )
    // );
    //
    // userWallet = async (address: Address) => blockchain.openContract(
    //   JettonWallet.createFromAddress(
    //     await jettonMinter.getWalletAddress(address)
    //   )
    // );

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