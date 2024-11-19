import { MainBox } from "@/common/MainBox";
import Grid from "@mui/material/Grid2";
import { LaunchInfo } from "./components/LaunchInfo";
import { ExtendedUserBalance, jettonFromNano, getCurrentSalePhase, SalePhase } from "starton-periphery";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { ArrowIcon, ArrowUpRightIcon } from "@/icons";
import styles from "./RewardsCard.module.scss";
import { CustomButton } from "@/common/CustomButton";
import { Disclosure, DisclosurePanel, DisclosureButton } from "@headlessui/react";
import { motion } from "framer-motion";
import { RewardCard } from "@/app/[locale]/[address]/components/RewardsInfo/components/RewardCard";

export function RewardsCard(extendedBalance: ExtendedUserBalance) {
  const t = useTranslations("Rewards");

  const { phase } = getCurrentSalePhase(extendedBalance.timings);
  
  function renderPhase() {
    switch (phase) {
    case SalePhase.CREATOR:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="green"
          padding="4px 10px"
          rounded
        >
          <Label
            label="Creator"
            variantSize="regular14"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    case SalePhase.WHITELIST:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="gray"
          padding="4px 10px"
          rounded
        >
          <Label
            label="Star Club"
            variantSize="regular14"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    case SalePhase.PUBLIC:
      return (
        <MainBox
          container
          alignItems="center"
          gap="2px"
          bgColor="orange"
          padding="4px 10px"
          rounded
        >
          <Label
            label="Public"
            variantSize="regular14"
            variantColor="orange"
            cropped
          />
        </MainBox>
      );
    case SalePhase.ENDED:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="orange"
          padding="4px 10px"
          rounded
        >
          <Label
            label="Ended"
            variantSize="regular14"
            variantColor="red"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    default:
      return null;
    }
  }

  return (
    <MainBox
      rounded
      padding={1.5}
      gap={1}
    >
      <LaunchInfo {...extendedBalance} />

      <Grid container size={12} paddingTop={0.5}>
        <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
      </Grid>

      <Grid
        container
        width="100%"
        justifyContent="space-between"
      >
        <Label
          label={t("jettonsToClaimTitle")}
          variantSize="regular14"
          variantColor="gray"
        />
        <Label
          label={jettonFromNano(extendedBalance.jettons)}
          variantSize="regular14"
        />
      </Grid>
    
      <Grid container size={12} paddingTop={0.5}>
        <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
      </Grid>

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
            label="0d. 0h. 0m."
            variantSize="regular14"
          />
        </Grid>
      </Grid>
    
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

                    123

                    123

                    123
                    {/* <RewardCard
                      rewardPool={balance.}
                    /> */}
                  </Grid>
                </motion.div> 
              )}
            </DisclosurePanel>
          </Grid>
        )}
      </Disclosure>

      <CustomButton
        background="gray"
        padding="10px 0"
        fullWidth
      >
        <Grid 
          container
          gap={1}
          alignItems="center"
          justifyContent="center"
        >
          <ArrowUpRightIcon />
          <Label 
            label={t("contributeMore")} 
            variantSize="medium16" 
            offUserSelect
          />
        </Grid>
      </CustomButton>
    </MainBox>
  );
}
