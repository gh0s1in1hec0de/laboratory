import { motion } from "framer-motion";
import { SubTasksProps } from "./types";
import Grid from "@mui/material/Grid2";
import { QuestIcon } from "@/icons";
import { Label } from "@/common/Label";
import { Box } from "@mui/material";
import { useSubTasks } from "./hooks/useSubTasks";
import { parseSubtasks } from "starton-periphery";

export function SubTasks({ subTasks, open, disabled }: SubTasksProps) {
  const { renderTextWithLinks } = useSubTasks(disabled);

  return (
    <motion.div
      initial={false}
      animate={{
        height: open ? "auto" : 0,
        opacity: open ? 1 : 0,
      }}
      style={{
        overflow: "hidden",
      }}
      transition={{
        height: { duration: 0.3, ease: [0.42, 0, 0.58, 1] },
        opacity: { duration: 0.1, ease: "easeInOut" },
        layout: { duration: 0.1, ease: "easeInOut" },
      }}
    >
      <Grid container padding="0 12px 14px 12px" gap={1}>
        <Grid container flexDirection="column">
          {parseSubtasks(subTasks).map((_, index) => (
            <QuestIcon 
              key={index} 
              variant={index === 0 ? "first" : index === subTasks.length - 1 ? "last" : "middle"} 
            />
          ))}
        </Grid> 

        <Grid 
          container
          flexDirection="column"
          size="grow"
          justifyContent="space-between"
        >
          {parseSubtasks(subTasks).map((subTask, index) => (
            <Grid 
              key={index} 
              container 
              flexDirection="column"
            >
              <Label
                label={subTask.name}
                variantSize="medium16"
                variantColor="white"
                offUserSelect
                disabled={disabled}
              />

              <Box>
                {renderTextWithLinks(subTask.description)}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </motion.div>
  );
}
