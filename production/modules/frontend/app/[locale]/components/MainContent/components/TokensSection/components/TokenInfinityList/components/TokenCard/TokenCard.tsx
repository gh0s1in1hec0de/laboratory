import { CustomAvatar } from "@/common/CustomAvatar";
import { Label } from "@/common/Label";
import { Stats } from "./components/Stats";
import Grid from "@mui/material/Grid2";
import styles from "./TokenCard.module.scss";
import { AdditionalInfo } from "./components/AdditionalInfo";

export function TokenCard() {
  const collected = 400;
  const max = 1000;
  const holders = 14000;

  return (
    <Grid
      container
      paddingY={1}
      alignItems="center"
      size="grow"
      gap={1}
      className={styles.card}
    >
      <CustomAvatar
        size="small"
        src="https://lirp.cdn-website.com/93aa737e/dms3rep/multi/opt/hacker-computer-systems-225f9fa9-1920w.jpg"
        alt="Token Logo"
      />

      <Grid
        container
        size="grow"
        justifyContent="space-between"
        // flexDirection="column"
        gap={0.5}
      >
        <Grid
          container
          flexWrap="nowrap"
          // maxWidth={{ xs: "150px", sm: "200px", md: "285px" }}
          flexDirection="column"
          className={styles.containerText}
        >
          <Label
            label="🤩 $FDSFDSFDSFdsadasfdsfdsdfds"
            variantSize="medium16"
            className={styles.launchTag}
          />

          <Label
            label="Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name Name "
            variantSize="regular16"
            variantColor="gray"
            className={styles.launchName}
          />

        </Grid>
  
        <Stats
          collected={collected}
          max={max}
        />

        <AdditionalInfo holders={holders} />
      </Grid>
    </Grid>
  );
}
