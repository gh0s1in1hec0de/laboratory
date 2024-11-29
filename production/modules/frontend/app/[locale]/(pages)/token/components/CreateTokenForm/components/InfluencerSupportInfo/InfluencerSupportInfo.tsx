import { Label } from "@/common/Label";
import { FormikCustomSwitch } from "@/components/FormikCustomSwitch";
import { SupportButton } from "@/components/SupportButton";
import { QuestionIcon } from "@/icons";
import { IconButton } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useField , useFormikContext } from "formik";
import { MarketingSupportTabsValues , CreateTokenFormFields } from "../../hooks/useCreateToken";
import { useTranslations } from "next-intl";
import { InfluencerSupportDrawer } from "./components/InfluencerSupportDrawer";
import { useToggle } from "@/hooks";

export function InfluencerSupportInfo() {
  const t = useTranslations("Token.influencerSupportCheckbox");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle();
  const { isSubmitting } = useFormikContext<CreateTokenFormFields>();
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
            size="grow"
            alignItems="center"
          >
            <Label
              label={t("label")}
              variantSize="semiBold18"
              disabled={isDisabled}
              offUserSelect
            />

            <IconButton
              sx={{ padding: 0 }}
              onClick={toggleOpenDrawer}
            >
              <QuestionIcon
                color="var(--orange-regular)"
              />
            </IconButton>
          </Grid>

          <InfluencerSupportDrawer
            isOpenDrawer={isOpenDrawer}
            toggleOpenDrawer={toggleOpenDrawer}
          />

          <FormikCustomSwitch
            name="influencerSupport"
            disabled={isDisabled || isSubmitting}
          />
        </Grid>

        {influencerSupportEnabled && (
          <Grid
            container
            width="100%"
            gap={1.5}
          >
            <Label
              label={t("description")}
              variantSize="regular16"
              variantColor="gray"
              disabled={isDisabled || isSubmitting}
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
