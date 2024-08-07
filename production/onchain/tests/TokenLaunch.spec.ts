import {compile} from "@ton/blueprint";
import {Address, beginCell, Cell, Dictionary, storeMessage, toNano, Transaction} from "@ton/core";
import {Blockchain, internal, SandboxContract, TreasuryContract} from "@ton/sandbox";
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


  // FUNCTIONS
  let printTxGasStats: (name: string, trans: Transaction) => bigint;
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
    tokenLaunchCodeRaw = await compile('TokenLaunch');
    blockchain = await Blockchain.create();
    walletStats = new StorageStats(1033, 3);


    const _libs = Dictionary.empty(Dictionary.Keys.BigUint(256), Dictionary.Values.Cell());
    _libs.set(BigInt(`0x${tokenLaunchCodeRaw.hash().toString('hex')}`), tokenLaunchCodeRaw);
    const libs = beginCell().storeDictDirect(_libs).endCell();
    blockchain.libs = libs;
    let lib_prep = beginCell().storeUint(2, 8).storeBuffer(tokenLaunchCodeRaw.hash()).endCell();
    tokenLaunchCode = new Cell({exotic: true, bits: lib_prep.bits, refs: lib_prep.refs});
    console.log('token launch code hash = ', tokenLaunchCode.hash().toString('hex'));
    console.log('jetton wallet code hash = ', tokenLaunchCode.hash().toString('hex'));
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

    // Measures compute fees of a tx
    printTxGasStats = (name, transaction) => {  // print fees from computePhase of tx
      const txComputed = computedGeneric(transaction);
      console.log(`${name} used ${txComputed.gasUsed} gas`);
      console.log(`${name} gas cost: ${txComputed.gasFees}`);
      return txComputed.gasFees;
    }

    // Measures forward fees of a cell structure
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

    // оценка комиссии за пересылку операции burn
    estimateBurnFwd = (prices) => {
      const curPrices = prices || msgPrices;
      return computeFwdFees(curPrices, 1n, 754n)
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
})