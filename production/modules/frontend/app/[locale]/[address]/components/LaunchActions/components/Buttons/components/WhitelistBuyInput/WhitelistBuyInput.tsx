import { CustomButton } from "@/common/CustomButton";
import { CustomInput } from "@/common/CustomInput";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { useWhitelistInput } from "./hooks/useWhitelistInput";
import { WhitelistBuyInputProps } from "./types";

export function WhitelistBuyInput({
  launchAddress,
  callerData,
}: WhitelistBuyInputProps) {
  console.log(callerData);
  const t = useTranslations("CurrentLaunch.contribute");
  const {
    amount,
    setAmount,
    isLoading,
    errorText,
    onClickBuyTokens,
  } = useWhitelistInput(launchAddress);

  return (
    <Grid
      container
      gap={1.45}
      width="100%"
    >
      <CustomInput
        value={amount}
        onChange={setAmount}
        placeholder={t("amountInput.placeholder")}
        type="number"
        fullWidth
        disabled={isLoading}
        disableBigFloat
        endAdornment={(
          <Label
            label={t("amountInput.currency")}
            variantSize="regular14"
            variantColor="grayDark"
            sx={{ paddingLeft: 1 }}
          />
        )}
      />

      {errorText && (
        <Label
          label={errorText}
          variantSize="regular14"
          textAlign="center"
          variantColor="red"
        />
      )}

      <CustomButton
        fullWidth
        padding="10px"
        onClick={onClickBuyTokens}
        disabled={isLoading}
      >
        <Label
          label={isLoading ? t("startButton.loading") : t("startButton.label")}
          variantSize="regular16"
        />
      </CustomButton>
    </Grid>
  );
}
