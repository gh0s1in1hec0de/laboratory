import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { QuestCard, QuestsTabs, Tab } from "./components/QuestsTabs";

export function QuestsList() {
  const t = useTranslations("Quests.content");

  const tabs: Tab<QuestCard>[] = [
    {
      label: "Quests.content.tabs.first.label",
      content: [
        {
          title: "Reach for the star 1",
          description: "2/3 Done",
          subQuests: [
            {
              name: "Task 01",
              description: "short description 1",
            },
            {
              name: "Task 02",
              description: "short description 2",
            },
            {
              name: "Task 03",
              description: "short description 3",
            },
          ],
        }, 
        {
          title: "Reach for the star 2",
          description: "1/3 Done",
          subQuests: [
            {
              name: "Task 01",
              description: "short description 2",
            },
            {
              name: "Task 02",
              description: "short description 2",
            },
          ],
        }, 
      ]
    },
    {
      label: "Quests.content.tabs.second.label",
      content: [
        {
          title: "Reach for the star 1 (staged)",
          description: "3/3 Done",
          subQuests: [
            {
              name: "Task 01 (staged)",
              description: "short description 1 (staged)",
            },
            {
              name: "Task 02 (staged)",
              description: "short description 2 (staged)",
            },
            {
              name: "Task 03 (staged)",
              description: "short description 3 (staged)",
            },
          ],
        },
        {
          title: "Reach for the star 2(staged)",
          description: "2/3 Done",
          subQuests: [
            {
              name: "Task 01 (staged)",
              description: "short description 1 (staged)",
            },
            {
              name: "Task 02 (staged)",
              description: "short description 2 (staged)",
            },
          ],
        }
      ]
    },
  ];

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

      <QuestsTabs 
        tabs={tabs}
      />
    </Grid>
  );
}
