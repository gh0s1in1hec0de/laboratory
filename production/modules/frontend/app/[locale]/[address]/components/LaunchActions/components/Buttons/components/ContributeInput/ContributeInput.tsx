import Grid from "@mui/material/Grid2";
import { CustomInput } from "@/common/CustomInput";
import { useTranslations } from "next-intl";
import { Label } from "@/common/Label";
import { CustomButton } from "@/common/CustomButton";
import { useContributeInput } from "./hooks/useContributeInput";

export function ContributeInput({ launchAddress }: { launchAddress: string }) {
  const t = useTranslations("CurrentLaunch.contribute");
  const {
    amount,
    setAmount,
    isValidAmount,
    getAmountError,
    isLoading,
    errorText,
    onClickBuyTokens,
  } = useContributeInput(launchAddress);

  return (
    <Grid 
      container
      gap={1.5}
      width="100%"
    >
      <CustomInput
        value={amount}
        onChange={setAmount}
        placeholder={t("amountInput.placeholder")}
        type="number"
        fullWidth
        disabled={isLoading}
        errorText={getAmountError()}
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
        disabled={!isValidAmount || isLoading}
      >
        <Label
          label={isLoading ? t("startButton.loading") : t("startButton.label")}
          variantSize="regular16"
        />
      </CustomButton>
    </Grid>
  );
}
