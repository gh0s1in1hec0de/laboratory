import {Address, beginCell, Cell, Contract, contractAddress, ContractProvider, SendMode} from "@ton/core";
import {TokensLaunchOps, SendMessageParams, tokenLauncherConfigToCell} from "./utils";
import {LaunchDataType, RefundRequestParams, SaleStateType, TokenLaunchStorage} from "./types";

export class TokenLaunch implements Contract {
  constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
  }

  static createFromAddress(address: Address) {
    return new TokenLaunch(address);
  }

  static createFromConfig(config: TokenLaunchStorage, code: Cell, workchain = 0) {
    const data = tokenLauncherConfigToCell(config);
    const init = {code, data};
    return new TokenLaunch(contractAddress(workchain, init), init);
  }

  async sendPublicBuy(provider: ContractProvider, sendMessageParams: SendMessageParams) {
    const {queryId, via, value} = sendMessageParams;

    const body = beginCell()
      .storeUint(TokensLaunchOps.public_buy, 32)
      .storeUint(queryId, 64)
      .endCell();
    await provider.internal(via, {
      value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
    });
  }

  async sendRefundRequest(provider: ContractProvider, sendMessageParams: SendMessageParams, params: RefundRequestParams) {
    const {refundValue, mode} = params;
    const {queryId, via, value} = sendMessageParams;

    const body = beginCell()
      .storeUint(TokensLaunchOps.refund_request, 32)
      .storeUint(queryId, 64)
      .storeUint(mode, 4)
      .storeCoins(refundValue)
      .endCell();
    await provider.internal(via, {
      value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
    });
  }

  async sendDeployJet(provider: ContractProvider, sendMessageParams: SendMessageParams) {
    const {queryId, via, value} = sendMessageParams;

    const body = beginCell()
      .storeUint(TokensLaunchOps.deploy_jet, 32)
      .storeUint(queryId, 64)
      .endCell();
    await provider.internal(via, {
      value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
    });
  }

  async sendJettonClaimRequest(provider: ContractProvider, sendMessageParams: SendMessageParams) {
    const {queryId, via, value} = sendMessageParams;

    const body = beginCell()
      .storeUint(TokensLaunchOps.jetton_claim_request, 32)
      .storeUint(queryId, 64)
      .endCell();
    await provider.internal(via, {
      value, sendMode: SendMode.PAY_GAS_SEPARATELY, body
    });
  }

  async getLaunchData(provider: ContractProvider): Promise<LaunchDataType> {
    let {stack} = await provider.get('get_launch_data', []);
    return {
      futJetTotalSupply: stack.readBigNumber(),
      creatorAddress: stack.readAddress(),
      metadata: stack.readCell()
    };
  }

  // possibly unnecessarily
  async getUserVaultAddress(provider: ContractProvider): Promise<Address> {
    let {stack} = await provider.get('get_user_vault_address', []);
    return stack.readAddress()
  }

  // possibly unnecessarily
  async getSaleState(provider: ContractProvider): Promise<SaleStateType> {
    let {stack} = await provider.get('get_sale_state', []);
    // TODO here should be readBigNumber or readNumber?
    return {
      rewardUtilJetsBalance: stack.readBigNumber(),
      generalStateStartTime: stack.readBigNumber(),
      creatorRoundEndTime: stack.readBigNumber(),
      wlRoundEndTime: stack.readBigNumber(),
      publicRoundEndTime: stack.readBigNumber(),
      totalTonsCollected: stack.readBigNumber(),
      futJetDeployedBalance: stack.readBigNumber()
    }
  }
}
