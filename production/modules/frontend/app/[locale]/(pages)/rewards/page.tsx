import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { RewardsHeader } from "./components/RewardsHeader";
import { RewardsList } from "./components/RewardsList";

export default function Rewards() {
  const t = useTranslations("Rewards");

  return (
    <Grid
      container
      width="100%"
      gap={1.5}
    >
      <RewardsHeader />
      <RewardsList />
    </Grid>
  );
}
