import { motion } from "framer-motion";
import { SubTasksProps } from "./types";
import Grid from "@mui/material/Grid2";
import { QuestIcon } from "@/icons";
import { Label } from "@/common/Label";

export function SubTasks({ subTasks, open, disabled }: SubTasksProps) {
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
          {subTasks.map((_, index) => (
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
          {subTasks.map((subTask, index) => (
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
              <Label
                label={subTask.description}
                variantSize="regular14"
                variantColor="gray"
                offUserSelect
                disabled={disabled}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    </motion.div>
  );
}
