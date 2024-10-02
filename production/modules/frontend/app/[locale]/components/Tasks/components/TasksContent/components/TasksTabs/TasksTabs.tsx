import { CustomButton } from "@/common/CustomButton";
import { TASKS_TABS } from "../../constants";
import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import styles from "./TasksTabs.module.scss";
import { TasksTabsProps } from "./types";
import { classNames } from "@/utils";

export function TasksTabs({ 
  selectedTab, 
  onChange,
  disabled
}: TasksTabsProps) {
  const t = useTranslations("");
  
  return (
    <Grid 
      className={classNames(
        styles.bg,
        { [styles.disabled]: disabled },
      )}
      container
      size={12}
      spacing={1}
    >
      {TASKS_TABS?.map((label) => (
        <Grid key={label.value} size={6}>
          <CustomButton 
            padding="8px"
            fullWidth 
            onClick={() => onChange(label.value)} 
            background={selectedTab === label.value ? "gray" : "transparent"}
            addHover={selectedTab !== label.value && !disabled}
            disabled={disabled}
          >
            <Label
              label={t(label.label)}
              variantSize="medium16"
              variantColor={selectedTab === label.value ? "white" : "gray"}
            />
          </CustomButton>
        </Grid>
      ))}
    </Grid>
  );
}
