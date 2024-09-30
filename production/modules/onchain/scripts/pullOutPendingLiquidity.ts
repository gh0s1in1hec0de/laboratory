import { DEFAULT_TIMEOUT, SUBWALLET_ID, TESTNET_FACTORY_ADDR } from "starton-periphery";
import { Asset, Factory, LiquidityDeposit, MAINNET_FACTORY_ADDR, PoolType } from "@dedust/sdk";
import { internal as internal_relaxed } from "@ton/core/dist/types/_helpers";
import { HighloadWalletV3 as HW } from "../wrappers/HighloadWalletV3";
import { JettonOps } from "../wrappers/JettonConstants";
import { Address, beginCell, toNano } from "@ton/core";
import { mnemonicToWalletKey } from "@ton/crypto";
import { NetworkProvider } from "@ton/blueprint";
import { SendMode, TonClient, } from "@ton/ton";
import dotenv from "dotenv";

dotenv.config();
const HIGHLOAD_WALLET_ADDRESS = Address.parse("0QBK4zTJLd16yMJmJVrtheEZFXQUPtocrA1OGTApws0GwJub");

// The app's code is its configuration - shout out to suckless.org folks
export async function run(provider: NetworkProvider) {
    const c = new TonClient({
        endpoint: "https://testnet.toncenter.com/api/v2/jsonRPC",
        apiKey: process.env.TONCENTER_TESTNET_API_KEY!
    });
    const mnemonic = process.env.HIGHLOAD_MNEMONIC!;
    const keyPair = await mnemonicToWalletKey(mnemonic.split(" "));
    const wallet = provider.open(HW.createFromAddress(HIGHLOAD_WALLET_ADDRESS));
    const factory = c.open(Factory.createFromAddress(TESTNET_FACTORY_ADDR));

    const asset = Asset.jetton(Address.parse("kQBEi8ykrnuLQ-uFuQtq-opHxMGwM0vYhEWWSW6Medux_WXZ"));
    const assets: [Asset, Asset] = [Asset.native(), asset];

    const liquidityDeposit = c.open(
        await factory.getLiquidityDeposit({
            ownerAddress: HIGHLOAD_WALLET_ADDRESS,
            poolType: PoolType.VOLATILE,
            assets,
        }),
    );
    const [r1, r2] = await liquidityDeposit.getBalances();
    console.log(`pending deposits: ${r1}, ${r2}`);

    await wallet.sendExternalMessage(keyPair.secretKey,
        {
            createdAt: Math.floor((Date.now() / 1000) - 10),
            queryId: 1n,
            message: internal_relaxed({
                to: liquidityDeposit.address,
                body: beginCell()
                    .storeUint(LiquidityDeposit.CANCEL_DEPOSIT, 32)
                    .storeUint(0, 64)
                    .storeMaybeRef(null)
                    .endCell(),
                value: toNano("0.5")
            }),
            mode: SendMode.PAY_GAS_SEPARATELY,
            subwalletId: SUBWALLET_ID,
            timeout: DEFAULT_TIMEOUT
        }
    );
}