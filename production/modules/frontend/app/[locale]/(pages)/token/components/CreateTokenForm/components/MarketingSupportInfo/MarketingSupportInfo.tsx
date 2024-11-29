import { CustomTabs } from "@/common/CustomTabs";
import { Label } from "@/common/Label";
import { FormikCustomSwitch } from "@/components/FormikCustomSwitch";
import { QuestionIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import { MARKETING_SUPPORT_TABS } from "./constants";
import { useMarketingSupportInfo } from "./hooks/useMarketingSupportInfo";
import { useTranslations } from "next-intl";
import { useFormikContext } from "formik";
import { CreateTokenFormFields } from "../../hooks/useCreateToken";
import { MarketingSupportDrawer } from "./components/MarketingSupportDrawer";

export function MarketingSupportInfo() {
  const t = useTranslations("Token.marketingSupportCheckbox");
  const { isSubmitting } = useFormikContext<CreateTokenFormFields>();
  const {
    marketingSupportValue,
    marketingSupportEnabled,
    handleMarketingSupportTabsChange,
    handleMarketingSupportEnabledChange,
    isOpenDrawer,
    toggleOpenDrawer,
  } = useMarketingSupportInfo();
  
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
              offUserSelect
            />

            <IconButton onClick={toggleOpenDrawer} sx={{ padding: 0 }}>
              <QuestionIcon color="var(--orange-regular)" />
            </IconButton>
          </Grid>

          <MarketingSupportDrawer
            isOpenDrawer={isOpenDrawer}
            toggleOpenDrawer={toggleOpenDrawer}
          />

          <FormikCustomSwitch
            name="marketingSupportEnabled"
            onChange={handleMarketingSupportEnabledChange}
            disabled={isSubmitting}
          />
        </Grid>

        <Label
          label={t("description")}
          variantSize="regular16"
          variantColor="gray"
          offUserSelect
        />
      </Grid>

      <CustomTabs
        variant="transparentOutline"
        selectedTab={marketingSupportValue}
        onChange={handleMarketingSupportTabsChange}
        tabs={MARKETING_SUPPORT_TABS}
        disabled={!marketingSupportEnabled || isSubmitting}
      />
    </Grid>
  );
}
