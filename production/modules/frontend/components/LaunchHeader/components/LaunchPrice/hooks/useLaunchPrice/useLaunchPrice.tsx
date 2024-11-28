import {
  calculatePrice,
  getAmountOut,
  GetConfigResponse,
  getContractData,
  getCurrentSalePhase,
  MoneyFlows,
  Network,
  SalePhase,
  getCurrentWlRate
} from "starton-periphery";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { Address } from "@ton/core";
import { TonClient4 } from "@ton/ton";
import { useEffect, useState } from "react";
import { UseLaunchPriceProps } from "./types";

export function useLaunchPrice({
  launchAddress,
  timings,
  version
}: UseLaunchPriceProps) {
  const [price, setPrice] = useState<number | null>(null);
  const { phase } = getCurrentSalePhase(timings);
  const [configData, setConfigData] = useState<GetConfigResponse & MoneyFlows | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          syntheticTonReserve,
          syntheticJetReserve,
          futJetDexAmount,
          futJetPlatformAmount,
          minTonForSaleSuccess,
          creatorFutJetBalance,
          publicRoundFutJetSold,
          pubRoundFutJetLimit,
          totalTonsCollected,
          wlRoundTonInvestedTotal,
        } = (await getContractData(
          "All",
          tonClient,
          // Address.parse("0:91b0b2deb5276bc2030315d3c650b0366138bc9ea8e1b10f1eade54271369b67")
          Address.parse(launchAddress),
        )) as GetConfigResponse & MoneyFlows;

        setConfigData({
          wlRoundFutJetLimit,
          wlRoundTonLimit,
          creatorFutJetLeft,
          creatorFutJetPriceReversed,
          creatorFutJetBalance,
          publicRoundFutJetSold,
          pubRoundFutJetLimit,
          totalTonsCollected,
          wlRoundTonInvestedTotal,
          futJetDexAmount,
          futJetPlatformAmount,
          minTonForSaleSuccess,
          syntheticTonReserve,
          syntheticJetReserve,
        });

      } catch (error) {
        console.error("Error fetching config data (getContractData):", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!configData) return;

    const { wlRoundFutJetLimit, syntheticTonReserve, syntheticJetReserve, wlRoundTonInvestedTotal } = configData;

    if (phase === SalePhase.PUBLIC || phase === SalePhase.ENDED) {
      const jettons = getAmountOut(
        version,
        SalePhase.PUBLIC,
        { syntheticJetReserve, syntheticTonReserve },
      );

      setPrice(calculatePrice(jettons));
    }

    if (phase === SalePhase.WHITELIST) {
      const price = getCurrentWlRate(
        wlRoundFutJetLimit,
        wlRoundTonInvestedTotal
      );

      setPrice(price);
    }
  }, [configData, version, phase]);

  return {
    price,
    isLoading,
  };
}
