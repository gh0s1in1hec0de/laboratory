import Grid from "@mui/material/Grid2";
import { WaveLaunchDescription } from "./components/WaveLaunchDescription";
import { RewardsDescription } from "./components/RewardsDescription";
import { RefundsDescription } from "./components/RefundsDescription";

export function Descriptions() {
  return (
    <Grid container flexDirection="column" gap={1}>
      <WaveLaunchDescription />
      <RefundsDescription />
      <RewardsDescription />
    </Grid>
  );
}
