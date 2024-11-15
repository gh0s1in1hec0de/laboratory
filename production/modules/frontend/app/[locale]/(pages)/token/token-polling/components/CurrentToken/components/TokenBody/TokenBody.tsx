import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useBuyToken } from "./hooks/useBuyToken";
import { CustomInput } from "@/common/CustomInput";
import { CustomButton } from "@/common/CustomButton";
import { StarIcon } from "@/icons";
import { TokenBodyProps } from "./types";

export function TokenBody({
  symbol,
}: TokenBodyProps) {
  const {
    value,
    setValue,
    onClickBuyTokens,
  } = useBuyToken();

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
          label="Contribute to your token"
          variantSize="semiBold18"
          cropped
        />

        {value ? (
          <Grid
            container
            alignItems="center"
            gap={1}
            width="100%"
          >
            <Label
              label="You will get"
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
                  label={`${value} $${symbol || "UNKNWN"}`}
                  variantSize="regular14"
                  variantColor="white"
                  cropped
                />
              </Grid>
            </Grid>
          </Grid>
        ) : (
          <Label
            label="Purchase up to 25% of the supply of your token"
            variantSize="regular16"
            variantColor="gray"
          />
        )}
      </Grid>

      {/* TODO: add check for 25% of the supply */}
      <CustomInput
        value={value}
        onChange={setValue}
        placeholder="Indicate the number of TON"
        type="number"
        fullWidth
        endAdornment={(
          <Label
            label="TON"
            variantSize="regular14"
            variantColor="grayDark"
            sx={{ paddingLeft: 1 }}
          />
        )}
      />

      <CustomButton
        padding="10px"
        onClick={onClickBuyTokens}
      >
        <Label
          label="Buy"
          variantSize="regular16"
        />
      </CustomButton>
    </Grid>
  );
}
