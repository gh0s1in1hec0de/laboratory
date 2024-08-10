import {
  Address,
  beginCell,
  Cell,
  Contract,
  contractAddress,
  ContractProvider,
  Dictionary,
  Sender,
  SendMode,
  Slice
} from "@ton/core";
import {Op} from "./constants";
import {randomAddress} from "../tests/utils";

interface IDontKnowYetProbablySomeBody {
  /** TODO
   * Взял из core.fc L84
   * какие тут будут типы, если там они int?
   */
  // msg_flags:;
  // sender_address: Address;
  // value:bigint; probably Coins
  // fwd_fee:bigint; probably Coins
}

/** TODO
 * Взял из core.fc L87 -> L8
 * тип для notFundedLaunches не могу корректно отпределить
 */
export type CoreConfig = {
  chief: Address;
  utilJettonMasterAddress: Address;
  utilJettonWalletAddress: Address;
  utilJetCurBalance: bigint;
  notFundedLaunches: Dictionary<Slice, Cell> | null;
  notFundedLaunchesAmount: number;
  launchConfig: {
    minTonForSaleSuccess: bigint;
    tonLimitForWlRound: bigint;
    utilJetRewardAmount: bigint;
    utilJetWlPassAmount: bigint;
    utilJetBurnPerWlPassAmount: bigint;
    jetWlLimitPct: number;
    jetPubLimitPct: number;
    jetDexSharePct: number;
    creatorRoundDurationMs: number;
    wlRoundDurationMs: number;
    pubRoundDurationMs: number;
  };
  contracts: {
    jettonLaunch: Cell;
    jettonLaunchUserVault: Cell;
    derivedJettonMaster: Cell;
    jettonWallet: Cell;
  };
};

export function coreConfigToCell(config: CoreConfig): Cell {
  const contractsCell = beginCell()
  .storeRef(config.contracts.jettonLaunch)
  .storeRef(config.contracts.jettonLaunchUserVault)
  .storeRef(config.contracts.derivedJettonMaster)
  .storeRef(config.contracts.jettonWallet)
  .endCell();

  const launchConfigCell = beginCell()
  .storeCoins(config.launchConfig.minTonForSaleSuccess)
  .storeCoins(config.launchConfig.tonLimitForWlRound)
  .storeCoins(config.launchConfig.utilJetRewardAmount)
  .storeCoins(config.launchConfig.utilJetWlPassAmount)
  .storeCoins(config.launchConfig.utilJetBurnPerWlPassAmount)
  .storeUint(config.launchConfig.jetWlLimitPct, 16)
  .storeUint(config.launchConfig.jetPubLimitPct, 16)
  .storeUint(config.launchConfig.jetDexSharePct, 16)
  .storeInt(config.launchConfig.creatorRoundDurationMs, 32)
  .storeInt(config.launchConfig.wlRoundDurationMs, 32)
  .storeInt(config.launchConfig.pubRoundDurationMs, 32)
  .endCell();

  return beginCell()
  .storeAddress(config.chief)
  .storeAddress(config.utilJettonMasterAddress)
  .storeAddress(config.utilJettonWalletAddress)
  .storeCoins(config.utilJetCurBalance)
  .storeDict(config.notFundedLaunches)
  .storeUint(config.notFundedLaunchesAmount, 8)
  .storeRef(launchConfigCell)
  .storeRef(contractsCell)
  .endCell();
}

export class Core implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
  }

  static createFromAddress(address: Address) {
    return new Core(address);
  }

  static createFromConfig(config: CoreConfig, code: Cell, workchain = 0) {
    const data = coreConfigToCell(config);
    const init = {code, data};
    return new Core(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(Op.core_init, 32).storeUint(0, 64).endCell(),
    });
  }

  async sendCreateLaunch(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint, launchParams: Cell) {
    const msgBody = beginCell()
    .storeUint(/* хуй знает что тут писать, мне пиздец уже */ 0, 4) // msg_flags
    .storeAddress(/* хуй знает что тут писать, мне пиздец уже */ randomAddress()) // sender_address
    .storeCoins(0) // attached_value
    .storeCoins(0) // fwd_fee_from_in_msg
    .endCell()

    return beginCell()
    .storeUint(Op.create_launch, 32)
    .storeUint(0, 64)
    .storeCoins(0)// total_supply
    .storeUint(0, 16)// platform_share_pct
    .storeRef(Cell.EMPTY)// metadata_cell
    // .storeRef(msgBody)
    .endCell()


  }
}