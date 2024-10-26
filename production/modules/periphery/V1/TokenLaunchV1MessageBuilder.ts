import { BalanceUpdateMode, Coins, OP_LENGTH, QUERY_ID_LENGTH, TokensLaunchOps } from "../standards";
import { SendTransactionRequest } from "@tonconnect/sdk";
import { beginCell } from "@ton/core";
import {
    CREATOR_BUYOUT_COMPUTE_FEE,
    CREATOR_REFUND_COMPUTE_FEE,
    PURCHASE_TX_COST_V1,
    REFUND_TX_COST_V1
} from "../fees";

export class TokenLaunchV1MessageBuilder {
    /*
    * - Creator buyout
    * - Wl purchase
    * - Public purchase
    * - Refund
    * - Claim
    * TODO Looks like we don't actually need ...* 100n / 99n... etc
    */
    public static creatorBuyoutMessage(
        { launchAddress, queryId, pureValue }: { launchAddress: string, queryId: number, pureValue: Coins },
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
                    amount: (pureValue * 100n / 99n + CREATOR_BUYOUT_COMPUTE_FEE).toString(),
                    address: launchAddress,
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    public static whitelistPurchaseMessage(
        { launchAddress, queryId, pureValue }: { launchAddress: string, queryId: number, pureValue: Coins },
        validUntil: number = Math.floor(Date.now() / 1000) + 90
    ): SendTransactionRequest {
        const body = beginCell()
            .storeUint(TokensLaunchOps.WhitelistPurchase, OP_LENGTH)
            .storeUint(queryId, QUERY_ID_LENGTH)
            .endCell();
        return {
            validUntil,
            messages: [
                {
                    amount: (pureValue * 100n / 99n + PURCHASE_TX_COST_V1).toString(),
                    address: launchAddress,
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    public static publicPurchaseMessage(
        { launchAddress, queryId, pureValue }: { launchAddress: string, queryId: number, pureValue: Coins },
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
                    amount: pureValue.toString(),
                    address: launchAddress,
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    public static refundMessage(
        { launchAddress, queryId, pureValue, mode = BalanceUpdateMode.TotalWithdrawal, isCreator = false }:
            {
                launchAddress: string,
                queryId: number,
                pureValue: Coins,
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
                amount: REFUND_TX_COST_V1.toString(),
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
                amount: CREATOR_REFUND_COMPUTE_FEE.toString(),
                address: launchAddress,
                payload: creatorRefundBody.toBoc().toString("base64")
            });
        }
        return { validUntil, messages };
    }
}