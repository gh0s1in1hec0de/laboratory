import {
  GetConfigResponse,
  MoneyFlows,
  Network,
  getContractData,
  getApproximateClaimAmountLegacy,
  calculateUserRewardAmount,
} from "starton-periphery";
import { useEffect, useState } from "react";
import { getHttpV4Endpoint } from "@orbs-network/ton-access";
import { Address, TonClient4 } from "@ton/ton";
import { useRewardBlockProps } from "./types";

export function useRewardBlock({
  rewardPool,
  extendedBalance
}: useRewardBlockProps) {
  const [configData, setConfigData] = useState<GetConfigResponse & MoneyFlows | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [displayValue, setDisplayValue] = useState<bigint>();

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
          Address.parse(extendedBalance.tokenLaunch),
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
      }
    })();
  }, []);

  useEffect(() => {
    try {
      if (configData) {
        const res = getApproximateClaimAmountLegacy(
          {
            creatorFutJetBalance: configData.creatorFutJetBalance,
            publicRoundFutJetSold: configData.publicRoundFutJetSold,
            syntheticJetReserve: configData.syntheticJetReserve,
            syntheticTonReserve: configData.syntheticTonReserve,
            totalTonsCollected: configData.totalTonsCollected,
            wlRoundTonInvestedTotal: configData.wlRoundTonInvestedTotal,
          },
          {
            creatorFutJetBalance: configData.creatorFutJetBalance,
            creatorFutJetLeft: configData.creatorFutJetLeft,
            creatorFutJetPriceReversed: configData.creatorFutJetPriceReversed,
            futJetDexAmount: configData.futJetDexAmount,
            futJetPlatformAmount: configData.futJetPlatformAmount,
            minTonForSaleSuccess: configData.minTonForSaleSuccess,
            pubRoundFutJetLimit: configData.pubRoundFutJetLimit,
            wlRoundFutJetLimit: configData.wlRoundFutJetLimit,
            wlRoundTonLimit: configData.wlRoundTonLimit
          },
          {
            jettons: BigInt(extendedBalance.jettons),
            whitelistTons: BigInt(extendedBalance.whitelistTons)
          },
          extendedBalance.isCreator
        );

        const res2 = calculateUserRewardAmount(BigInt(res), BigInt(extendedBalance.totalSupply), BigInt(rewardPool.rewardAmount));

        setDisplayValue(res2);
      }
    } catch (error) {
      console.error("Error in getApproximateClaimAmount:", error);
    } finally {
      setIsLoading(false);
    }
  }, [configData]);

  return {
    isLoading,
    displayValue
  };
}
