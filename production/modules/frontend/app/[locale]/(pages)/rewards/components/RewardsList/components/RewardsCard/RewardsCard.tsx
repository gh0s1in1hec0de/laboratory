import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { RewardBlock } from "./components/RewardBlock";
import { ArrowIcon } from "@/icons";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import Grid from "@mui/material/Grid2";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { jettonFromNano } from "starton-periphery";
import { useRewardsCard } from "./hooks/useRewardsCard";
import { LaunchInfo } from "./components/LaunchInfo";
import styles from "./RewardsCard.module.scss";
import { RewardsCardProps } from "./types";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import Skeleton from "@mui/material/Skeleton";
import { formatTime } from "@/utils";

export function RewardsCard({
  extendedBalance,
  rewardPool,
  callerData,
}: RewardsCardProps) {
  const t = useTranslations("Rewards");
  const {
    days,
    hours,
    minutes,
    renderPhase,
    renderButton,
    errorText,
    isPending,
    isLoading,
    displayValue
  } = useRewardsCard(extendedBalance);

  return (
    <LoadingWrapper isLoading={isPending}>
      <MainBox
        rounded="xs"
        padding={1.5}
        gap={1}
      >
        <LaunchInfo balance={extendedBalance} callerData={callerData} />

        <Grid container size={12} paddingTop={0.5}>
          <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
        </Grid>

        <Grid
          container
          width="100%"
          justifyContent="space-between"
        >
          {isLoading ? (
            <Skeleton
              sx={{ bgcolor: "var(--skeleton-color)" }}
              variant="rounded"
              width="100%"
              height="50px"
            />
          ) : (
            <>
              <Label
                label={t("jettonsToClaimTitle")}
                variantSize="regular14"
                variantColor="gray"
              />
              <Label
                label={displayValue ? `~${Number(jettonFromNano(displayValue)).toFixed(2)}` : t("dontHaveBalance")}
                variantSize="regular14"
              />
            </>
          )}
        </Grid>

        <Grid container size={12} paddingTop={0.5}>
          <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
        </Grid>

        {extendedBalance.isSuccessful ? (
          (() => {
            const { days, hours, minutes } = formatTime(extendedBalance.timings.endTime - Math.floor(Date.now() / 1000) < 0 ? 0 : extendedBalance.timings.endTime - Math.floor(Date.now() / 1000));

            return (
              <Grid
                container
                width="100%"
                justifyContent="space-between"
              >
                <Grid container gap={0.5} alignItems="center">
                  <Label
                    label={t("claimUntil")}
                    variantSize="regular14"
                    variantColor="orange"
                  />
                </Grid>
        
                <Grid container>
                  <Label
                    label={`${days}d. ${hours}h. ${minutes}m.`}
                    variantSize="regular14"
                  />
                </Grid>
              </Grid>
            );
          })()
        ) : (
          <Grid
            container
            width="100%"
            justifyContent="space-between"
          >
            <Grid container gap={0.5} alignItems="center">
              <Label
                label={t("stage")}
                variantSize="regular14"
                variantColor="gray"
              />

              {renderPhase()}
            </Grid>

            <Grid container gap={0.5}>
              <Label
                label={t("remainingTime")}
                variantSize="regular14"
                variantColor="gray"
              />
              <Label
                label={`${days}d. ${hours}h. ${minutes}m.`}
                variantSize="regular14"
              />
            </Grid>
          </Grid>
        )}



        <Grid container size={12} paddingTop={0.5}>
          <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
        </Grid>

        <Disclosure>
          {({ open }) => (
            <Grid
              container
              alignItems="center"
              justifyContent="space-between"
              width="100%"
            >
              <DisclosureButton
                as="div"
                className={styles.button}
              >
                <Grid
                  container
                  width="100%"
                  justifyContent="space-between"
                >
                  <Label
                    label={t("rewards")}
                    variantSize="regular14"
                    variantColor="gray"
                    offUserSelect
                  />

                  <ArrowIcon
                    className={styles.icon}
                    isRotate={open}
                  />
                </Grid>
              </DisclosureButton>

              <DisclosurePanel static style={{ width: "100%" }}>
                {({ open }) => (
                  <motion.div
                    initial={false}
                    animate={{
                      height: open ? "auto" : 0,
                      opacity: open ? 1 : 0,
                    }}
                    style={{
                      overflow: "hidden",
                    }}
                    transition={{
                      height: { duration: 0.3, ease: [0.42, 0, 0.58, 1] },
                      opacity: { duration: 0.1, ease: "easeInOut" },
                      layout: { duration: 0.1, ease: "easeInOut" },
                    }}
                  >
                    <Grid
                      container
                      gap={2}
                      paddingTop={2}
                    >
                      {rewardPool?.map((reward, index) => (
                        <RewardBlock
                          key={index}
                          rewardPool={reward}
                          extendedBalance={extendedBalance}
                        />
                      ))}
                    </Grid>
                  </motion.div>
                )}
              </DisclosurePanel>
            </Grid>
          )}
        </Disclosure>
      
        {errorText && (
          <Grid container width="100%" justifyContent="center">
            <Label
              label={errorText}
              variantSize="regular14"
              variantColor="red"
            />
          </Grid>
        )}

        {renderButton()}
      </MainBox>
    </LoadingWrapper>
  );
}
