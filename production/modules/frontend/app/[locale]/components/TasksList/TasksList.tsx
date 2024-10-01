import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { QuestCard, TasksTabs, Tab } from "./components/TasksTabs";
import { TonProvider } from "@/providers/ton";
import { localStorageWrapper } from "@/utils";

export function TasksList() {
  const t = useTranslations("Quests.content");

  return (
    <Grid 
      container
      flexDirection="column"
      gap={1}
      width="100%"
    >
      <Label
        label={t("title")}
        variantSize="semiBold18"
      />

      <TonProvider>
        <TasksTabs />
      </TonProvider>
    </Grid>
  );
}
