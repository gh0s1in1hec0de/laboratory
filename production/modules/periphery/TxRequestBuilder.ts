import { Address, beginCell, Cell, toNano } from "@ton/core";
import { getQueryId, tokenMetadataToCell } from "./utils";
import { SendTransactionRequest } from "@tonconnect/sdk";
import { fees, JETTON_MIN_TRANSFER_FEE } from "./fees";
import { LaunchParams } from "lauchpad/wrappers/types";
import { StringifiedCoins } from "./Database";
import {
    QUERY_ID_LENGTH,
    BalanceUpdateMode,
    TokensLaunchOps,
    GlobalVersions,
    OP_LENGTH,
    JettonOps,
    CoreOps,
    Coins
} from "./standards";

/*
* - Create launch
* - Creator buyout
* - Wl purchase
* - Public purchase
* - Refund
* - Claim
*/
export class TxRequestBuilder {
    public static createLaunch(
        {
            coreAddress,
            queryId = Math.floor(Date.now()),
            amount = toNano("1").toString()
        }: {
            coreAddress: string,
            queryId?: number,
            amount?: StringifiedCoins
        },
        {
            totalSupply,
            platformSharePct,
            metadata,
            startTime = Math.floor(Date.now() / 1000) + 60,
            maybePackedConfig = null
        }:
            LaunchParams & { maybePackedConfig: Cell | null },
        validUntil: number = Math.floor(Date.now() / 1000) + 90
    ): SendTransactionRequest {
        const body = beginCell()
            .storeUint(CoreOps.CreateLaunch, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeMaybeRef(maybePackedConfig)
            .storeCoins(totalSupply)
            .storeUint(platformSharePct, 16)
            .storeRef(metadata instanceof Cell ? metadata : tokenMetadataToCell(metadata))
            .storeInt(startTime, 32)
            .endCell();
        return {
            validUntil,
            messages: [
                {
                    amount,
                    address: coreAddress,
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    public static creatorBuyoutMessage(
        { launchAddress, amount, queryId = Math.floor(Date.now()) }: {
            launchAddress: string,
            queryId?: number,
            amount: StringifiedCoins
        },
        validUntil: number = Math.floor(Date.now() / 1000) + 90
    ): SendTransactionRequest {
        const body = beginCell()
            .storeUint(TokensLaunchOps.CreatorBuyout, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        return {
            validUntil,
            messages: [
                {
                    amount,
                    address: launchAddress,
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    // Should be called ONLY if user is whitelisted
    public static whitelistPurchaseV1Message(
        { launchAddress, amount }: { launchAddress: string, amount: StringifiedCoins },
        validUntil: number = Math.floor(Date.now() / 1000) + 90
    ): SendTransactionRequest {
        const body = beginCell()
            .storeUint(TokensLaunchOps.WhitelistPurchase, OP_LENGTH)
            .storeUint(getQueryId(), QUERY_ID_LENGTH)
            .endCell();
        return {
            validUntil,
            messages: [
                {
                    amount,
                    address: launchAddress,
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    // Actually a jetton transfer
    public static whitelistPurchaseV2Message(
        { launchAddress, amount, queryId = Math.floor(Date.now()) }: {
            launchAddress: string,
            queryId?: number,
            amount: Coins
        },
        { userAddress, userWalletAddress, jettonAmount }: {
            userAddress: Address,
            userWalletAddress: Address,
            jettonAmount: Coins
        },
        validUntil: number = Math.floor(Date.now() / 1000) + 90
    ): SendTransactionRequest {
        const body = beginCell().storeUint(JettonOps.Transfer, 32).storeUint(queryId ?? 0, 64)
            .storeCoins(jettonAmount)
            .storeAddress(Address.parse(launchAddress))
            .storeAddress(userAddress)
            .storeMaybeRef(null)
            .storeCoins(BigInt(amount))
            .storeMaybeRef(null)
            .endCell();
        return {
            validUntil,
            messages: [
                {
                    amount: (amount + JETTON_MIN_TRANSFER_FEE).toString(),
                    address: userWalletAddress.toString(),
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    public static publicPurchaseMessage(
        { launchAddress, amount, queryId = Math.floor(Date.now()), }: {
            launchAddress: string,
            queryId?: number,
            amount: StringifiedCoins
        },
        validUntil: number = Math.floor(Date.now() / 1000) + 90
    ): SendTransactionRequest {
        const body = beginCell()
            .storeUint(TokensLaunchOps.PublicPurchase, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        return {
            validUntil,
            messages: [
                {
                    // As the system uses AMM, it is better for us just to
                    // precalculate it with all the nuances in getPublicAmountOut
                    amount,
                    address: launchAddress,
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    public static refundMessage(
        version: GlobalVersions,
        {
            launchAddress,
            queryId = Math.floor(Date.now()),
            mode = BalanceUpdateMode.TotalWithdrawal,
            isCreator = false
        }: {
            launchAddress: string,
            queryId?: number,
            mode: BalanceUpdateMode,
            isCreator?: boolean
        },
        validUntil: number = Math.floor(Date.now() / 1000) + 90
    ): SendTransactionRequest {
        const commonRefundBody = beginCell()
            .storeUint(TokensLaunchOps.RefundRequest, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .storeUint(mode, 4)
            .endCell();
        const messages = [
            {
                amount: fees[version].refund.toString(),
                address: launchAddress,
                payload: commonRefundBody.toBoc().toString("base64")
            }
        ];
        if (isCreator) {
            const creatorRefundBody = beginCell()
                .storeUint(TokensLaunchOps.CreatorRefund, OP_LENGTH)
                .storeUint(queryId, QUERY_ID_LENGTH)
                .endCell();
            messages.push({
                amount: fees[version].refund.toString(),
                address: launchAddress,
                payload: creatorRefundBody.toBoc().toString("base64")
            });
        }
        return { validUntil, messages };
    }

    public static claimMessage(
        version: GlobalVersions,
        { launchAddress, queryId = Math.floor(Date.now()) }: { launchAddress: string, queryId?: number, },
        validUntil: number = Math.floor(Date.now() / 1000) + 90
    ): SendTransactionRequest {
        const commonRefundBody = beginCell()
            .storeUint(TokensLaunchOps.JettonClaimRequest, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        return {
            validUntil,
            messages: [
                {
                    amount: fees[version].claim.toString(),
                    address: launchAddress,
                    payload: commonRefundBody.toBoc().toString("base64")
                }
            ]
        };
    }
}