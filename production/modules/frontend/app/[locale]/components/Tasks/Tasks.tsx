import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { TasksContent } from "./components/TasksContent";
import { TonProvider } from "@/providers/ton";

export function Tasks() {
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
        <TasksContent />
      </TonProvider>
    </Grid>
  );
}
