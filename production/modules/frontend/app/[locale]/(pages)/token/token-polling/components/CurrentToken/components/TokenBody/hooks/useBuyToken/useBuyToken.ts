import { getErrorText } from "@/utils";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { UseBuyTokenProps } from "./types";
import { GetConfigResponse, getAmountOut, getContractData, getCurrentSalePhase, GlobalVersions, MAX_WL_ROUND_TON_LIMIT, SalePhase, TxRequestBuilder, jettonFromNano } from "starton-periphery";
import { Address, fromNano, toNano } from "@ton/core";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TonClient4 } from "@ton/ton";

export function useBuyToken({ supply, launchAddress, timings, version }: UseBuyTokenProps) {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>("");
  const [tonConnectUI] = useTonConnectUI();
  const t = useTranslations("Token.currentToken.amountInput");

  // todo: make global
  // (async () => {
  //   const tonClient = new TonClient4({
  //     endpoint: await getHttpV4Endpoint({ network: "mainnet" }),
  //   });

  //   const { creatorFutJetLeft, creatorFutJetPriceReversed } = (await getContractData(
  //     "Config",
  //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //     // @ts-ignore
  //     tonClient,
  //     Address.parse(launchAddress),
  //   )) as GetConfigResponse;

  //   const creatorMaxTons = creatorFutJetLeft * MAX_WL_ROUND_TON_LIMIT / creatorFutJetPriceReversed;
  //   console.log(creatorMaxTons);
  //   console.log(creatorFutJetLeft);
  //   return { creatorMaxTons, creatorFutJetLeft };
  // })();
  
  const numericAmount = BigInt(amount);
  const isValidAmount = numericAmount > 0;

  function getAmountError(): string {
    if (numericAmount < 0) {
      return "Token.currentToken.amountInput.errors.negative";
    }
    return "";
  }

  async function onClickBuyTokens() {
    try {
      setIsLoading(true);

      const transaction = TxRequestBuilder.creatorBuyoutMessage(
        {
          launchAddress: launchAddress,
          amount: toNano(amount).toString(),
        },
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });
    } catch (error) {
      setErrorText(getErrorText(error, t("errors.buyingError")));
    } finally {
      setIsLoading(false);
    }
  }

  return {
    amount,
    setAmount,
    onClickBuyTokens,
    isValidAmount,
    getAmountError,
    // creatorMaxTons: fromNano(creatorMaxTons),
    // creatorFutJetLeft: jettonFromNano(creatorFutJetLeft),
    errorText,
    isLoading,
  };
}
