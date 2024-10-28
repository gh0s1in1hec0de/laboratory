import { OP_LENGTH, QUERY_ID_LENGTH, BalanceUpdateMode, GlobalVersions, TokensLaunchOps } from "./standards";
import { SendTransactionRequest } from "@tonconnect/sdk";
import { StringifiedCoins } from "./Database";
import { beginCell } from "@ton/core";
import { fees } from "./fees";

// TODO
export class TxRequestBuilder {
    /*
    * - Creator buyout
    * - Wl purchase
    * - Public purchase
    * - Refund
    * - Claim
    */
    public static creatorBuyoutMessage(
        { launchAddress, queryId, amount }: { launchAddress: string, queryId: number, amount: StringifiedCoins },
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

    public static whitelistPurchaseMessage(
        { launchAddress, queryId, amount }: { launchAddress: string, queryId: number, amount: StringifiedCoins },
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
                    amount,
                    address: launchAddress,
                    payload: body.toBoc().toString("base64")
                }
            ]
        };
    }

    public static publicPurchaseMessage(
        { launchAddress, queryId, amount }: { launchAddress: string, queryId: number, amount: StringifiedCoins },
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
        { launchAddress, queryId, mode = BalanceUpdateMode.TotalWithdrawal, isCreator = false }: {
            launchAddress: string,
            queryId: number,
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
}