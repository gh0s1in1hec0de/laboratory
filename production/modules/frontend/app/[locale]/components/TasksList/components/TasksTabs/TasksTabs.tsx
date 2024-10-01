"use client";

// import { QuestsTabsProps } from "./types";
import { TabGroup, TabList, TabPanels } from "@headlessui/react";
import Grid from "@mui/material/Grid2";
import { useEffect, useState } from "react";
import { QuestTab } from "./components/QuestTab";
import { useTasks } from "./hooks/useTasks";
import styles from "./TasksTabs.module.scss";
import { TabLabel } from "./components/TabLabel";
import { TABS_LABELS } from "./constants";
import { useToggle } from "@/hooks";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { Skeleton } from "@mui/material";
import { localStorageWrapper } from "@/utils";
import { useIsConnectionRestored } from "@tonconnect/ui-react";

export function TasksTabs() {
  // const { 
  //   tasks, 
  //   error, 
  //   staged, 
  //   setStaged, 
  //   isLoading 
  // } = useTasks();
  const connectionRestored = useIsConnectionRestored();
  console.log(localStorageWrapper.get("address"));
  console.log(connectionRestored);

  // useEffect(() => {
  //   if (!address || !connectionRestored) {
  //     return;
  //   }
  // }, [connectionRestored, address]);

  // if (!localStorageWrapper.get("address")) {
  //   return <div>Connect your wallet to get tasks</div>;
  // }

  return (
    <>123</>
    // <LoadingWrapper 
    //   isLoading={isLoading || !address || !connectionRestored}
    //   skeleton={<Skeleton
    //     sx={{ bgcolor: "var(--skeleton-color)" }}
    //     variant="rounded"
    //     width="100%"
    //     height="40px"
    //   />}
    // >
    //   <TabGroup
    //     selectedIndex={Number(staged)}
    //     onChange={setStaged}
    //     className={styles.tabs}
    //   >
    //     <TabList className={styles.bg}>
    //       <Grid container gap={1}>
    //         {TABS_LABELS?.map((label) => (
    //           <TabLabel
    //             key={label}
    //             label={label}
    //           />
    //         ))}
    //       </Grid>
    //     </TabList>

  //     <TabPanels>
  //       {tasks.map((task, index) => (
  //         // <QuestTab
  //         //   key={task.taskId}
  //         //   task={task}
  //         //   index={index}
  //         // />
  //         <div key={task.taskId}>{task.name}</div>
  //       ))}
  //     </TabPanels>
  //   </TabGroup>
  // </LoadingWrapper>


  // <CustomTabs 
  //   tabLabels={TABS_LABELS}
  // >
  //   {tasks?.map((task, index) => (
  //     <QuestTab 
  //       key={task.taskId} 
  //       content={task} 
  //       index={index}
  //     />
  //   ))}
  // </CustomTabs>
  );
}
