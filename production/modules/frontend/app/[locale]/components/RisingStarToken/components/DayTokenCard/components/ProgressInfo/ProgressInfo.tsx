import Grid from "@mui/material/Grid2";
import { ProgressInfoProps } from "./types";
import { Label } from "@/common/Label";
import LinearProgress from "@mui/material/LinearProgress";
import styles from "./ProgressInfo.module.scss";
import { useTranslations } from "next-intl";

export function ProgressInfo({
  collected,
  max,
}: ProgressInfoProps) {
  const t = useTranslations("CurrentLaunch");

  return (
    <Grid
      container
      size={{ xs: 12 }}
      paddingTop={1}
      justifyContent="center"
      direction="column"
    >
      <Grid
        container
        size={{ xs: 12 }}
        justifyContent="flex-end"
        gap={0.5}
      >
        <LinearProgress
          variant="determinate"
          value={collected > max ? 100 : collected / max * 100}
          classes={{
            bar: styles.bar,
            root: styles.root,
          }}
        />

        <Label
          label={`${collected} / ${max} ${t("collectedLabel")}`}
          variantSize="regular14"
          variantColor="gray"
        />
      </Grid>
    </Grid>
  );
} 
