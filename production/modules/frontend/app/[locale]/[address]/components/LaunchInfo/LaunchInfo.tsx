import Grid from "@mui/material/Grid2";
import { useLocale, useTranslations } from "next-intl";
import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { LaunchInfoBox } from "./components/LaunchInfoBox";
import { LaunchInfoProps } from "./types";
import { IconButton } from "@mui/material";
import { CopyIcon } from "@/icons";
import { RefundButton } from "./components/RefundButton";
import { jettonFromNano } from "starton-periphery";
import { TonProvider } from "@/providers/ton";
import { useToggle } from "@/hooks";
import { CustomToast } from "@/common/CustomToast";
import { toCorrectAmount } from "@/utils";

export function LaunchInfo({
  launchData,
  showRefund = false,
}: LaunchInfoProps) {
  const t = useTranslations("CurrentLaunch.info");
  const [openToast, toggleOpenToast] = useToggle(false);
  const locale = useLocale();

  function onClickCopyAddress() {
    toggleOpenToast();
    navigator.clipboard.writeText(launchData?.address ?? "");
  }

  return (
    <Grid 
      container
      flexDirection="column"
      gap={1.5}
      width="100%"
    >
      <Label 
        label={t("title")}
        variantSize="semiBold18" 
        cropped
      />

      <MainBox
        rounded="xs"
        paddingX={1.5}
        paddingY={2}
        gap={2}
      >
        <Label
          label={launchData?.metadata.description ?? ""}
          variantSize="regular16"
        />
        
        <Grid container size={12} paddingTop={0.5}>
          <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
        </Grid>

        <Grid 
          container
          width="100%"
          gap={1}
        >
          <LaunchInfoBox
            label={t("supply")}
            // todo: заменить если цены отъебнут
            // value={jettonFromNano(launchData?.totalSupply ?? 0n)}
            value={toCorrectAmount({ amount: Number(jettonFromNano(launchData?.totalSupply ?? 0n)), locale: locale as "en" | "ru" })}
          />

          <LaunchInfoBox
            label={t("marketing")}
            value={launchData?.platformShare ? `${launchData?.platformShare}%` : t("no")}
          />

          <LaunchInfoBox
            label={t("influencer")}
            value={launchData?.influencerSupport ? t("yes") : t("no")}
          />
        </Grid>

        <Grid container size={12} paddingTop={0.5}>
          <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
        </Grid>

        <Grid 
          container
          width="100%"
          flexDirection="column"
          gap={1}
        >
          <Grid container justifyContent="space-between">
            <Label
              label={t("address")}
              variantSize="regular16"
            />

            <IconButton
              onClick={onClickCopyAddress}
              sx={{
                minWidth: "50px",
                padding: 0,
              }}
            >
              <CopyIcon />
            </IconButton>
          </Grid>

          <Grid container size="grow">
            <Label
              label={launchData?.address ?? ""}
              variantSize="regular14"
              variantColor="orange"
              sx={{ wordBreak: "break-word" }}
            />
          </Grid>
          
          <CustomToast
            open={openToast}
            toggleOpen={toggleOpenToast}
            text={t("successCopy")}
            severity="success"
          />
        </Grid>
      </MainBox>
      
      {showRefund && (
        <TonProvider>
          <RefundButton launchData={launchData} />
        </TonProvider>
      )}
    </Grid>
  );
}
