import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { MainBox } from "@/common/MainBox";
import { Disclosure, DisclosurePanel, DisclosureButton } from "@headlessui/react";
import styles from "./RewardInfo.module.scss";
import { motion } from "framer-motion";
import { useLaunchRewards } from "./hooks/useLaunchRewards";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import type { RewardsInfoProps } from "./types";
import { RewardCard } from "@/components/RewardCard";
import { Fragment } from "react";
import { RewardsInfoSkeleton } from "./components/RewardsInfoSkeleton";

export function RewardsInfo({ address }: RewardsInfoProps) {
  const t = useTranslations("CurrentLaunch.rewards");
  const {
    rewardsData,
    isLoading,
    errorText
  } = useLaunchRewards(address);

  return (
    <LoadingWrapper 
      isLoading={isLoading}
      skeleton={<RewardsInfoSkeleton />}
    >
      <Grid
        container
        flexDirection="column"
        gap={1.5}
        width="100%"
      >
        <Grid
          container
          flexDirection="column"
          gap={0.5}
        >
          <Label
            label={t("title")}
            variantSize="semiBold18"
          />
          <Label
            label={t("description")}
            variantSize="regular16"
            variantColor="gray"
          />
        </Grid>

        {errorText ? (
          <Label
            label={errorText}
            variantSize="regular16"
            variantColor="red"
          />
        ) : (
          <Disclosure>
            {({ open }) => (
              <MainBox
                container
                rounded="xs"
                alignItems="center"
                size={12}
                paddingY={3}
                showMoreRewards
                isOpen={open}
                position="relative"
              >
                <DisclosureButton
                  as="div"
                  className={styles.button}
                >
                  &nbsp;
                </DisclosureButton>
                
                <Grid
                  container
                  gap={2}
                  width="100%"
                >
                  {!rewardsData || Object.keys(rewardsData).length === 0 ? (
                    <Label
                      label={t("noRewards")}
                      variantSize="regular16"
                      variantColor="gray"
                      textAlign="center"
                      cropped
                    />
                  ) : (
                    Object.entries(rewardsData).map(([key, rewardPools]) => (
                      <Fragment key={`top-${key}`}>
                        {rewardPools.slice(0, 3).map((rewardPool, index) => (
                          <RewardCard
                            key={`${rewardPool.rewardJetton}-${index}`}
                            rewardPool={rewardPool}
                          />
                        ))}
                      </Fragment>
                    ))
                  )}
                </Grid>

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
                        {rewardsData && Object.entries(rewardsData).map(([key, rewardPools]) => (
                          <Fragment key={`top-${key}`}>
                            {rewardPools.slice(3).map((rewardPool, index) => (
                              <RewardCard
                                key={`${rewardPool.rewardJetton}-${index}`}
                                rewardPool={rewardPool}
                              />
                            ))}
                          </Fragment>
                        ))}
                      </Grid>
                    </motion.div>
                  )}
                </DisclosurePanel>
              </MainBox>
            )}
          </Disclosure>
        )}
      </Grid>
    </LoadingWrapper>
  );
}
