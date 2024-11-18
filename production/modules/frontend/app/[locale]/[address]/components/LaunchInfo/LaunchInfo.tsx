import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { Label } from "@/common/Label";
import { MainBox } from "@/common/MainBox";
import { LaunchInfoBox } from "./components/LaunchInfoBox";
import { LaunchInfoProps } from "./types";
import { IconButton } from "@mui/material";
import { CopyIcon } from "@/icons";
import { RefundButton } from "./components/RefundButton";
import { jettonFromNano } from "starton-periphery";
import { TonProvider } from "@/providers/ton";

export function LaunchInfo({
  launchData,
}: LaunchInfoProps) {
  const t = useTranslations("CurrentLaunch.info");

  function onClickCopyAddress() {
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
        rounded
        paddingX={1.5}
        paddingY={2}
        gap={2}
      >
        <Label
          label={t("description")}
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
            value={jettonFromNano(launchData?.totalSupply ?? 0n)}
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
        >
          <Grid container size="grow">
            <Label
              label={launchData?.address ?? ""}
              variantSize="regular14"
              variantColor="orange"
              sx={{ wordBreak: "break-word" }}
            />
          </Grid>

          {/* todo: add success copy */}
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
      </MainBox>
      
      {!launchData?.isSuccessful && (
        <TonProvider>
          <RefundButton launchData={launchData} />
        </TonProvider>
      )}
    </Grid>
  );
}
