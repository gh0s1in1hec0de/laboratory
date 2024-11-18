import { getErrorText } from "@/utils";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { getAmountOut, getContractData, getCurrentSalePhase, GlobalVersions, SalePhase, TxRequestBuilder } from "starton-periphery";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { UseBuyTokenProps } from "./types";
import { fromNano, toNano } from "@ton/core";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { TonClient4 } from "@ton/ton";

export async function useBuyToken({ supply, launchAddress, timings, version }: UseBuyTokenProps) {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>("");
  const [tonConnectUI] = useTonConnectUI();
  const t = useTranslations("Token.currentToken.amountInput");

  // todo: make global
  const tonClient = new TonClient4({
    endpoint: await getHttpV4Endpoint({ network: "mainnet" }),
  });

  const data = await getContractData(
    "WlPhaseLimits",
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    tonClient,
    launchAddress,
  );
  
  const numericAmount = BigInt(amount);
  const isValidAmount = numericAmount > 0;

  const receivedNanoJettons = getAmountOut(
    version,
    getCurrentSalePhase(timings).phase as SalePhase.CREATOR | SalePhase.WHITELIST | SalePhase.PUBLIC,
    data,
    toNano(10),
  );

  // макс кол-во токенов, которые можно купить
  const tonMaxAmount = (BigInt(supply) * 25n / 100n) * toNano(10) / receivedNanoJettons;
  
  const jettonAmount = BigInt(supply) * 25n / 100n;

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
    jettonAmount,
    tonMaxAmount,
    errorText,
    isLoading,
  };
}
