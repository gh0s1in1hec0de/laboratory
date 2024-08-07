import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode} from "@ton/core";
import {Slice} from "@ton/ton";

export type TokenLaunchConfig = {
  futJetTotalSupply: bigint;      // this::const::fut_jet_total_supply
  minTonForSaleSuccess: bigint;   // this::const::min_ton_for_sale_success
  chiefAddress: Address;          // this::const::chief_address
  creatorAddress: Address;        // this::const::creator_address
  utilJetWalletAddress: Address;  // jet_tools::const::util_jet_wallet_address
  metadata: Cell;                 // jet_tools::const::metadata
  futJetMasterCode: Cell;         // jet_tools::const::fut_jet_master_code
  walletCode: Cell;               // jet_tools::const::wallet_code
};

export function tokenLauncherConfigToCell(config: TokenLaunchConfig): Cell {
  return beginCell()
  .storeCoins(config.futJetTotalSupply)
  .storeCoins(config.minTonForSaleSuccess)
  .storeAddress(config.chiefAddress)
  .storeAddress(config.creatorAddress)
  .storeRef(
      // TODO initialize in a separate variable as it have done in load_data
    beginCell()
    .storeAddress(config.utilJetWalletAddress)
    .storeRef(config.metadata)
    .storeRef(config.futJetMasterCode)
    .storeRef(config.walletCode)
    .endCell()
  )
  .endCell();
}

export function endParse(slice: Slice) {
  if (slice.remainingBits > 0 || slice.remainingRefs > 0) {
    throw new Error('remaining bits in data');
  }
}

export function parseTokenLaunchrData(data: Cell) {
  const sc = data.beginParse();
  const parsed = {
    isInitialized: sc.loadInt(1),
    futJetTotalSupply: sc.loadCoins(),
    minTonForSaleSuccess: sc.loadCoins(),
    futJetCurBalance: sc.loadCoins(),
    rewardUtilJetsCurBalance: sc.loadCoins(),
    chiefAddress: sc.loadAddress(),
    creatorAddress: sc.loadAddress(),
    saleConfig: sc.loadRef(),
    jetTools: {
      utilJetWalletAddress: sc.loadAddress(),
      metadata: sc.loadRef(),
      futJetMasterCode: sc.loadRef(),
      walletCode: sc.loadRef()
    }
  };
  endParse(sc);
  return parsed;
}

export class TokenLaunch implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
  }

  static createFromAddress(address: Address) {
    return new TokenLaunch(address);
  }

  static createFromConfig(config: TokenLaunchConfig, code: Cell, workchain = 0) {
    const data = tokenLauncherConfigToCell(config);
    const init = {code, data};
    return new TokenLaunch(contractAddress(workchain, init), init);
  }

  async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
    await provider.internal(via, {
      value,
      sendMode: SendMode.PAY_GAS_SEPARATELY,
      // точни ли тело должно быть пустым? (не смог найти где деплой в token_launcher.fc) (возможно core.fc - 82?)
      body: beginCell().endCell(),
    });
  }

  async getLaunchData(provider: ContractProvider) {
    let {stack} = await provider.get('get_launch_data', []);
    return {
      futJetTotalSupply: stack.readBigNumber(),
      creatorAddress: stack.readAddress(),
      metadata: stack.readCell()
    };
  }

  // We gonna create new launches with Core contract, not manually
  static initializeMessage(senderAddress: Address, futJetWalletAddress: Address, utilJetWalletAddress: Address) {
    return beginCell()
      .storeAddress(senderAddress)
      .storeAddress(futJetWalletAddress)
      .storeAddress(utilJetWalletAddress)
      .endCell();
  }
}
