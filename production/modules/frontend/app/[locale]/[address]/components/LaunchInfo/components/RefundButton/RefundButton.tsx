import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { useRefound } from "./hooks/useRefound";
import { localStorageWrapper } from "@/utils";
import type { RefundButtonProps } from "./types";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { RefundDrawer } from "./components/RefundDrawer";

export function RefundButton({
  launchData,
}: RefundButtonProps) {
  const t = useTranslations("CurrentLaunch.info.refundButton");
  const { 
    onClickRefund,
    isLoading,
    errorText,
    isOpenDrawer,
    toggleOpenDrawer,
  } = useRefound({
    launchData,
    userAddress: localStorageWrapper.get("address") ?? "",
  });

  return (
    <Grid 
      container
      width="100%"
      paddingY={1}
    >
      {errorText && (
        <Grid
          container
          width="100%"
          justifyContent="center"
          paddingBottom={1}
        >
          <Label
            label={errorText}
            variantSize="regular14"
            variantColor="red"
          />
        </Grid>
      )}

      <CustomConnectButton
        fullWidth
        showDropdown={false}
        successChildren={(
          <CustomButton 
            background="red"
            padding="10px"
            fullWidth
            onClick={toggleOpenDrawer}
          >
            <Label
              label={isLoading ? t("loading") : t("label")}
              variantSize="medium16"
            />
          </CustomButton>
        )}
      />

      <RefundDrawer
        isOpenDrawer={isOpenDrawer}
        toggleOpenDrawer={toggleOpenDrawer}
        onClickRefund={onClickRefund}
      />
    </Grid>
  );
}
