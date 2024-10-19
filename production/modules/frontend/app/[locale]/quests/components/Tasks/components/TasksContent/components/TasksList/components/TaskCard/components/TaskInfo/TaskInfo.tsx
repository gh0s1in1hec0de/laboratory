import { TaskInfoProps } from "./types";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import styles from "./TaskInfo.module.scss";
import { useTranslations } from "next-intl";
import { StarIcon, TicketIcon, ArrowIcon } from "@/icons";

export function TaskInfo({ title, completed, reward, open, disabled }: TaskInfoProps) {
  const t = useTranslations("Tasks.content");

  return (
    <Grid 
      container
      alignItems="center" 
      gap={1}
    >
      <TicketIcon />

      <Grid container flexDirection="column" gap={0.25}>
        <Label 
          label={title} 
          variantSize="medium16"
          offUserSelect
          disabled={disabled}
        />

        <Grid container gap={1} alignItems="center">
          <Label 
            label={completed ? t("done") : t("notDone")} 
            variantSize="regular14" 
            variantColor={completed ? "green" : "orange"}
            offUserSelect
            disabled={disabled}
          />

          <StarIcon />

          <Label 
            label={`${reward} ${t("ticket")}`} 
            variantSize="regular14" 
            variantColor="gray"
            offUserSelect
            disabled={disabled}
          />
        </Grid>
      </Grid>

      <ArrowIcon className={styles.icon} isRotate={open} />

      {open && (
        <Grid container size={12} paddingTop={0.5}>
          <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
        </Grid>
      )}
    </Grid>
  );
}
