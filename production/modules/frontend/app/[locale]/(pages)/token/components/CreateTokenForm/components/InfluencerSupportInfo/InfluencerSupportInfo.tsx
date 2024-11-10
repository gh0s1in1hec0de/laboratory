import { Label } from "@/common/Label";
import { FormikCustomSwitch } from "@/components/FormikCustomSwitch";
import { SupportButton } from "@/components/SupportButton";
import { QuestionIcon } from "@/icons";
import { IconButton } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useField } from "formik";
import { MarketingSupportTabsValues } from "../../hooks/useCreateToken";

export function InfluencerSupportInfo() {
  const [{ value: marketingSupportValue }, { }, { }] = useField("marketingSupportValue");
  const [{ value: marketingSupportEnabled }, { }, { }] = useField("marketingSupportEnabled");
  const [{ value: influencerSupportEnabled }, { }, { }] = useField("influencerSupport");
  const isDisabled = marketingSupportValue === MarketingSupportTabsValues.LOW || !marketingSupportEnabled;

  return (
    <Grid
      container
      width="100%"
      gap={1.5}
    >
      <Grid
        container
        gap={0.5}
        width="100%"
      >
        <Grid
          container
          width="100%"
          justifyContent="space-between"
        >
          <Grid
            container
            gap={0.5}
            alignItems="center"
          >
            <Label
              label="Influencer support"
              variantSize="semiBold18"
              disabled={isDisabled}
              offUserSelect
            />

            <IconButton
              sx={{ padding: 0 }}
              onClick={() => { }}
            >
              <QuestionIcon
                color={isDisabled ? "var(--orange-dark)" : "var(--orange-regular)"}
              />
            </IconButton>
          </Grid>

          <FormikCustomSwitch
            name="influencerSupport"
            disabled={isDisabled}
          />
        </Grid>

        {influencerSupportEnabled && (
          <Grid
            container
            width="100%"
            gap={1.5}
          >
            <Label
              label="Choose the percent of the token supply you'd like to donate to get StartON marketing support"
              variantSize="regular16"
              variantColor="gray"
              disabled={isDisabled}
              offUserSelect
            />

            <SupportButton
              withLabel={false}
            />
          </Grid>
        )}
      </Grid>
    </Grid>
  );
}
