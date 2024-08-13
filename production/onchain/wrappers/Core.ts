import {OpCore, TEP64JettonMetadata, TEP64MetadataToCell} from "./utils";
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
} from "@ton/core";

export type CoreConfig = {
  chief: Address,
  utilJettonMasterAddress: Address,
  utilJettonWalletAddress: Address,
  utilJetCurBalance: bigint,
  notFundedLaunches: Dictionary<Address, Cell> | null,
  notFundedLaunchesAmount: number,
  launchConfig: {
    minTonForSaleSuccess: bigint,
    tonLimitForWlRound: bigint,
    utilJetRewardAmount: bigint,
    utilJetWlPassAmount: bigint,
    utilJetBurnPerWlPassAmount: bigint,
    jetWlLimitPct: number,
    jetPubLimitPct: number,
    jetDexSharePct: number,
    creatorRoundDurationMs: number,
    wlRoundDurationMs: number,
    pubRoundDurationMs: number,
  };
  contracts: {
    jettonLaunch: Cell,
    jettonLaunchUserVault: Cell,
    derivedJettonMaster: Cell,
    jettonWallet: Cell,
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

export type CreateLaunchParams = {
  startTime: number, // Unix timestamp
  totalSupply: bigint | number,
  platformSharePct: number,
  metadata: Cell | TEP64JettonMetadata,
};
export type UpgradeParams = {
  // TODO TF is new data 2 and 3
  newData2: number,
  newData3: Address,
  newData: Cell,
  newCode: Cell,
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
      body: beginCell().storeUint(OpCore.init, 32).storeUint(0, 64).endCell(),
    });
  }

  async sendCreateLaunch(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint, params: CreateLaunchParams) {
    const {startTime, totalSupply, platformSharePct, metadata} = params;
    const packagedMetadata = metadata instanceof Cell ? metadata : TEP64MetadataToCell(metadata);
    const body = beginCell()
      .storeUint(OpCore.create_launch, 32)
      .storeUint(queryId, 64)
      .storeInt(startTime, 32)
      .storeCoins(totalSupply)
      .storeUint(platformSharePct, 16)
      .storeRef(packagedMetadata)
      .endCell();
    await provider.internal(via, {
      value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
    });
  }

  async sendUpgrade(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint, params: UpgradeParams) {
    const {newData, newCode} = params;
    const body = beginCell()
      .storeUint(OpCore.upgrade, 32)
      .storeUint(queryId, 64)
      .storeRef(newData)
      .storeRef(newCode)
      .endCell();
    await provider.internal(via, {
      value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
    });
  }
}