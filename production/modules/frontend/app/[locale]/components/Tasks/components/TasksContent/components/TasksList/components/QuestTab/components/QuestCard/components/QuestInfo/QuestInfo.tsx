import { QuestInfoProps } from "./types";
import { Label } from "@/common/Label";
import { ArrowIcon, StarIcon, TicketIcon } from "@/icons/quests";
import Grid from "@mui/material/Grid2";
import styles from "./QuestInfo.module.scss";

export function QuestInfo({ title, completed, reward, open, disabled }: QuestInfoProps) {
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
            label={completed ? "Done" : "Not Done"} 
            variantSize="regular14" 
            variantColor={completed ? "green" : "orange"}
            // variantColor="orange"
            offUserSelect
            disabled={disabled}
          />

          <StarIcon />

          <Label 
            label={`reward ${reward} ticket`} 
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
