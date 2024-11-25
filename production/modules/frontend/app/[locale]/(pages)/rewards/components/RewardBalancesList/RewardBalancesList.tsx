import Grid from "@mui/material/Grid2";
import { CustomAvatar } from "@/common/CustomAvatar";
import { Label } from "@/common/Label";
import { RewardBalancesListProps } from "./types";
import { jettonFromNano } from "starton-periphery";
import { CustomButton } from "@/common/CustomButton";
import { useTranslations } from "next-intl";
import { useRewardBalancesList } from "./hooks/useRewardBalancesList";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { RewardBalancesListSkeleton } from "./components/RewardBalancesListSkeleton";

export function RewardBalancesList({ rewardBalances }: RewardBalancesListProps) {
  const t = useTranslations("Rewards");
  const { 
    isLoading,
    errorText,
    claimAllRewards,
  } = useRewardBalancesList();

  return (
    <LoadingWrapper
      isLoading={isLoading}
      skeleton={<RewardBalancesListSkeleton/>}
    >
      <Grid
        container
        width="100%"
        justifyContent="center"
        gap={1.5}
      >
        {errorText && (
          <Label
            label={errorText}
            variantColor="red"
            variantSize="regular14"
          />
        )}
      
        <CustomButton
          padding="10px"
          fullWidth
          onClick={claimAllRewards}
        >
          <Label
            label={isLoading ? t("claimAllLoading") : t("claimAll")}
            variantColor="white"
            variantSize="regular16"
          />
        </CustomButton>

        <Grid
          container
          width="100%"
          gap={1.5}
        >
          {rewardBalances.map((reward, index) => (
            <Grid 
              key={index}
              container 
              width="100%"
              alignItems="center"
            >
              <Grid
                container
                paddingLeft={1.5}
              >
                <CustomAvatar
                  size="extraSmall"
                  src={reward.metadata.image ?? "https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"}
                  alt="Reward Logo"
                />
              </Grid>

              <Grid
                container
                size="grow"
                paddingLeft={1}
              >
                <Label
                  label={reward.metadata.name ?? "Unknown"}
                  variantSize="medium16"
                  cropped
                />
              </Grid>

              <Grid
                container
                paddingX={1.5}
              >
                <Label
                  label={`${jettonFromNano(reward.balance)} $${reward.metadata.symbol ?? "UNKNWN"}`}
                  variantSize="regular14"
                  variantColor="gray"
                  cropped
                />
              </Grid>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </LoadingWrapper>
  );
}
