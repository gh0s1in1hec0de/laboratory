import Grid from "@mui/material/Grid2";
import styles from "./CustomTabs.module.scss";
import { CustomTabsProps, CustomTabsVariant } from "./types";
import { useTranslations } from "next-intl";
import { classNames } from "@/utils";
import { CustomButton } from "../CustomButton";
import { Label } from "../Label";
import { TAB_VARIANT_CONFIG } from "./constants";

export function CustomTabs<T>({
  selectedTab,
  onChange,
  disabled,
  tabs,
  variant = CustomTabsVariant.DEFAULT,
}: CustomTabsProps<T>) {
  const t = useTranslations("");
  const config = TAB_VARIANT_CONFIG[variant];

  return (
    <Grid 
      className={classNames(
        styles.bg,
        { [styles.disabled]: disabled },
        [styles[variant]]
      )}
      container
      size={12}
      spacing={1}
    >
      {tabs.map((tab, index) => {
        const isSelected = selectedTab === tab.value;
        const { button, label } = config;

        return (
          <Grid key={index} size={6}>
            <CustomButton 
              padding="8px"
              fullWidth 
              onClick={() => onChange(tab.value)} 
              background={button.background(isSelected)}
              addHover={button.addHover(isSelected, disabled)}
              disabled={disabled}
              borderColor={button.borderColor(isSelected)}
            >
              <Label
                label={t(tab.label)}
                variantSize="medium16"
                variantColor={label.variantColor(isSelected)}
              />
            </CustomButton>
          </Grid>
        );
      })}
    </Grid>
  );
}
