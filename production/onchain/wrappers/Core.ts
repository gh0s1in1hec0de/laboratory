import {coreConfigToCell, CoreOps, SendMessageParams, TEP64MetadataToCell} from "./utils";
import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode,} from "@ton/core";
import {CoreConfig, CreateLaunchParams, LaunchConfigType, StateType, UpgradeParams} from "./types";

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

  async sendDeploy(provider: ContractProvider, sendMessageParams: Omit<SendMessageParams, 'queryId'>) {
    const {via, value} = sendMessageParams;
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      body: beginCell().storeUint(CoreOps.init, 32).storeUint(0, 64).endCell(),
    });
  }

  async sendCreateLaunch(provider: ContractProvider, sendMessageParams: SendMessageParams, params: CreateLaunchParams) {
    const {startTime, totalSupply, platformSharePct, metadata} = params;
    const {queryId, via, value} = sendMessageParams;
    const packagedMetadata = metadata instanceof Cell ? metadata : TEP64MetadataToCell(metadata);

    const body = beginCell()
      .storeUint(CoreOps.create_launch, 32)
      .storeUint(queryId, 64)
      .storeCoins(totalSupply)
      .storeUint(platformSharePct, 16)
      .storeRef(packagedMetadata)
      .storeInt(startTime, 32)
      .endCell();
    await provider.internal(via, {
      value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
    });
  }

  async sendUpgrade(provider: ContractProvider, sendMessageParams: SendMessageParams, params: UpgradeParams) {
    const {newData, newCode} = params;
    const {queryId, via, value} = sendMessageParams;

    const body = beginCell()
      .storeUint(CoreOps.upgrade, 32)
      .storeUint(queryId, 64)
      .storeRef(newData)
      .storeRef(newCode)
      .endCell();
    await provider.internal(via, {
      value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
    });
  }

  // possibly unnecessarily
  async getState(provider: ContractProvider): Promise<StateType> {
    let {stack} = await provider.get('get_state', []);
    return {
      notFundedLaunches: stack.readCell(),
      notFundedLaunchesAmount: stack.readBigNumber(),
      utilJetCurBalance: stack.readBigNumber()
    };
  }

  // possibly unnecessarily
  async getLaunchConfig(provider: ContractProvider): Promise<LaunchConfigType> {
    let {stack} = await provider.get('get_launch_config', []);
    return {
      minTonForSaleSuccess: stack.readBigNumber(),
      tonLimitForWlRound: stack.readBigNumber(),
      utilJetRewardAmount: stack.readBigNumber(),
      utilJetWlPassAmount: stack.readBigNumber(),
      utilJetBurnPerWlPassAmount: stack.readBigNumber(),
      jetWlLimitPct: stack.readBigNumber(),
      jetPubLimitPct: stack.readBigNumber(),
      jetDexSharePct: stack.readBigNumber(),
      creatorRoundDurationMs: stack.readBigNumber(),
      wlRoundDurationMs: stack.readBigNumber(),
      pubRoundDurationMs: stack.readBigNumber(),
    };
  }
}