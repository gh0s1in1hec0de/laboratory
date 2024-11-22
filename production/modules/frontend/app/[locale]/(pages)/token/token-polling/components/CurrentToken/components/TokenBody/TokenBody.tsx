import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useBuyToken } from "./hooks/useBuyToken";
import { CustomInput } from "@/common/CustomInput";
import { CustomButton } from "@/common/CustomButton";
import { StarIcon } from "@/icons";
import { TokenBodyProps } from "./types";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { useTranslations } from "next-intl";

export function TokenBody({
  symbol,
  supply,
  launchAddress,
  timings,
  version,
}: TokenBodyProps) {
  const t = useTranslations("Token.currentToken");
  const {
    amount,
    setAmount,
    onClickBuyTokens,
    errorText,
    isLoading,
    amountOut,
    creatorMaxTons,
  } = useBuyToken({
    supply,
    launchAddress,
    timings,
    version,
  });

  return (
    <Grid
      container
      flexDirection="column"
      width="100%"
      gap={1.5}
    >
      <Grid
        container
        width="100%"
        gap={0.5}
      >
        <Label
          label={t("title")}
          variantSize="semiBold18"
          cropped
        />

        {amount ? (
          <Grid
            container
            alignItems="center"
            gap={1}
            width="100%"
          >
            <Label
              label={t("subtitle2")}
              variantColor="gray"
              variantSize="regular16"
            />

            <Grid
              container
              alignItems="center"
              gap={0.5}
              size="grow"
            >
              <StarIcon />

              <Grid
                container
                size="grow"
              >
                <Label
                  label={`${Number(amount) <= 0 ? 0 : amountOut} $${symbol || "UNKNWN"}`}
                  variantSize="regular14"
                  variantColor="white"
                  cropped
                />
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Label
            label={`${t("subtitle")} (${creatorMaxTons} TON)`}
            variantSize="regular16"
            variantColor="gray"
          />
        )}
      </Grid>

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

      <CustomConnectButton
        fullWidth
        showDropdown={false}
        successChildren={(
          <CustomButton
            padding="10px"
            onClick={onClickBuyTokens}
            disabled={isLoading}
          >
            <Label
              label={isLoading ? t("buyButton.loading") : t("buyButton.label")}
              variantSize="regular16"
            />
          </CustomButton>
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
    </Grid>
  );
}
