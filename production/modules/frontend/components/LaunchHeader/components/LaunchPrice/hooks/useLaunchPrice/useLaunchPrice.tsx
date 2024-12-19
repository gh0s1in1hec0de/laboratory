import {
  calculatePrice,
  getAmountOut,
  GetConfigResponse,
  getContractData,
  getCurrentSalePhase,
  MoneyFlows,
  Network,
  SalePhase,
  Caller,
  getCurrentWlRate,
  jettonFromNano
} from "starton-periphery";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { Address, fromNano, toNano } from "@ton/core";
import { TonClient4 } from "@ton/ton";
import { useEffect, useState } from "react";
import { UseLaunchPriceProps } from "./types";
import { userService } from "@/services/user";
import { CALLER_ADDRESS } from "@/constants";
import { localStorageWrapper } from "@/utils";

export function useLaunchPrice({
  launchAddress,
  timings,
  version
}: UseLaunchPriceProps) {
  const [price, setPrice] = useState<number | null>(null);
  const { phase } = getCurrentSalePhase(timings);
  const [configData, setConfigData] = useState<GetConfigResponse & MoneyFlows | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [callerData, setCallerData] = useState<Caller | null>(null);

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

        const callerData = await userService.getCaller(localStorageWrapper.get(CALLER_ADDRESS));
        setCallerData(callerData);
      } catch (error) {
        console.error("Error fetching config data (getContractData):", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!configData) return;

    const { 
      wlRoundFutJetLimit,
      syntheticTonReserve,
      syntheticJetReserve,
      wlRoundTonInvestedTotal,
      wlRoundTonLimit
    } = configData;

    if (phase === SalePhase.PUBLIC || phase === SalePhase.ENDED) {
      const tons = process.env.NEXT_PUBLIC_NETWORK === "testnet" ? toNano("0.25") : toNano("10");

      const jettons = getAmountOut(
        version,
        SalePhase.PUBLIC,
        { syntheticJetReserve, syntheticTonReserve },
        tons,
        !!callerData?.invitedBy
      );

      setPrice(calculatePrice(jettons, tons));
    }

    if (phase === SalePhase.WHITELIST) {
      if (timings.startTime < Number(process.env.NEXT_PUBLIC_MINOR_VERSION_TIME_SEPARATOR)) {
        const price = getCurrentWlRate(
          wlRoundFutJetLimit,
          wlRoundTonInvestedTotal
        );
  
        setPrice(price);
      } else {
        const price = Number(fromNano(wlRoundTonLimit)) / Number(jettonFromNano(wlRoundFutJetLimit));
        setPrice(price);
      }
    }
  }, [configData, version, phase, callerData, timings.startTime]);

  return {
    price,
    isLoading,
  };
}
