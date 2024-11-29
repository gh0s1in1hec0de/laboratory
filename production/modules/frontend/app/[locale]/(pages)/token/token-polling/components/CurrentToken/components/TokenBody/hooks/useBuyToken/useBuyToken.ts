import { 
  GetConfigResponse, 
  GlobalVersions, 
  MAX_WL_ROUND_TON_LIMIT, 
  Network, 
  SalePhase, 
  TxRequestBuilder, 
  fees, 
  getAmountOut, 
  getContractData, 
  jettonFromNano,
} from "starton-periphery";
import { getErrorText } from "@/utils";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { Address, fromNano, toNano } from "@ton/core";
import { TonClient4 } from "@ton/ton";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { UseBuyTokenProps } from "./types";

export function useBuyToken({ launchAddress, version }: UseBuyTokenProps) {
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string>("");
  const [tonConnectUI] = useTonConnectUI();
  const t = useTranslations("Token.currentToken.amountInput");

  const [configData, setConfigData] = useState<{
    wlRoundFutJetLimit: bigint;
    wlRoundTonLimit: bigint;
    creatorFutJetLeft: bigint;
    creatorFutJetPriceReversed: bigint;
    creatorMaxTons: string;
  } | null>(null);
  const [amountOut, setAmountOut] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const tonClient = new TonClient4({
          endpoint: await getHttpV4Endpoint({ network: process.env.NEXT_PUBLIC_NETWORK as Network }),
        });

        const {
          creatorFutJetLeft,
          creatorFutJetPriceReversed,
          wlRoundFutJetLimit,
          wlRoundTonLimit,
        } = (await getContractData(
          "Config",
          tonClient,
          // Address.parse("0:91b0b2deb5276bc2030315d3c650b0366138bc9ea8e1b10f1eade54271369b67"),
          Address.parse(launchAddress),
        )) as GetConfigResponse;

        const creatorMaxTons =
          (creatorFutJetLeft * MAX_WL_ROUND_TON_LIMIT) / creatorFutJetPriceReversed;

        setConfigData({
          wlRoundFutJetLimit,
          wlRoundTonLimit,
          creatorFutJetLeft,
          creatorFutJetPriceReversed,
          creatorMaxTons: fromNano(creatorMaxTons),
        });
      } catch (error) {
        console.error("Error fetching config data (getContractData):", error);
      }
    })();
  }, []);

  useEffect(() => {
    if (!configData || !amount || Number(amount) <= 0) return;

    const { wlRoundFutJetLimit, wlRoundTonLimit } = configData;

    const result = getAmountOut(
      version,
      SalePhase.CREATOR,
      { wlRoundFutJetLimit, wlRoundTonLimit },
      toNano(amount)
    );

    setAmountOut(jettonFromNano(result));
  }, [amount, configData, version]);

  // async function get(){
  //   const tonClient = new TonClient4({
  //     endpoint: await getHttpV4Endpoint({ network: "testnet" }),
  //   });

  //   const { creatorFutJetLeft, creatorFutJetPriceReversed, wlRoundFutJetLimit, wlRoundTonLimit } = (await getContractData(
  //     "Config",
  //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //     // @ts-ignore
  //     tonClient,
  //     Address.parse("0:91b0b2deb5276bc2030315d3c650b0366138bc9ea8e1b10f1eade54271369b67"),
  //     // Address.parse(launchAddress),
  //   )) as GetConfigResponse;

  //   const a = getAmountOut(
  //     version,
  //     SalePhase.CREATOR,
  //     { wlRoundFutJetLimit, wlRoundTonLimit },
  //     toNano(amount),
  //   );

  //   console.log(jettonFromNano(a));

  //   // max tons 
  //   const creatorMaxTons = creatorFutJetLeft * MAX_WL_ROUND_TON_LIMIT / creatorFutJetPriceReversed;
  //   // console.log(creatorMaxTons);
  //   // console.log(creatorFutJetLeft);
  //   return { creatorMaxTons: fromNano(creatorMaxTons), amountOut: jettonFromNano(a) };
  // }

  // get();

  async function onClickBuyTokens() {
    try {
      setIsLoading(true);

      const transaction = TxRequestBuilder.creatorBuyoutMessage(
        {
          launchAddress: launchAddress,
          amount: toNano(amount + fees[GlobalVersions.V1].creatorBuyout).toString(),
        },
      );

      await tonConnectUI.sendTransaction(transaction, { modals: ["error"] });
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
    amountOut,
    creatorMaxTons: configData?.creatorMaxTons,
    errorText,
    isLoading,
  };
}
