import {
  calculatePrice,
  getAmountOut,
  GetConfigResponse,
  getContractData,
  getCurrentSalePhase,
  MoneyFlows,
  Network,
  SalePhase,
  SyntheticReserves,
  WlPhaseLimits
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
          endpoint: await getHttpV4Endpoint({ network: process.env.NEXT_PUBLIC_NETWORK_TESTNET as Network }),
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

    const { wlRoundFutJetLimit, wlRoundTonLimit, syntheticTonReserve, syntheticJetReserve } = configData;

    const jettons = getAmountOut(
      version,
      phase === SalePhase.WHITELIST ? SalePhase.WHITELIST : phase === SalePhase.PUBLIC ? SalePhase.PUBLIC : SalePhase.CREATOR,
      phase === SalePhase.WHITELIST ? { wlRoundFutJetLimit, wlRoundTonLimit } : phase === SalePhase.PUBLIC ? { syntheticJetReserve, syntheticTonReserve } : { } as WlPhaseLimits | SyntheticReserves,
    );

    setPrice(calculatePrice(jettons));
  }, [configData, version, phase]);


  return {
    price,
    isLoading,
  };  
}
