import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { MainBox } from "@/common/MainBox";
import { TaskCardProps } from "./types";
import { SubTasks } from "./components/SubTasks";
import { TaskInfo } from "./components/TaskInfo";
import styles from "./TaskCard.module.scss";

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Disclosure>
      {({ open }) => (
        <MainBox 
          container
          rounded="xs"
          alignItems="center"
          size={12}
        >
          <DisclosureButton 
            as="div" 
            className={styles.button}
          >
            <TaskInfo 
              title={task.name}
              completed={task.completed}
              reward={task.rewardTickets}
              open={open}
              disabled={task.completed}
            />
          </DisclosureButton>

          <DisclosurePanel static style={{ width: "100%" }}>
            {({ open }) => (
              <SubTasks 
                subTasks={task.description} 
                open={open} 
                disabled={task.completed}
              />
            )}
          </DisclosurePanel>
        </MainBox>
      )}
    </Disclosure>
  );
}
