import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { MainBox } from "@/common/MainBox";
import { TaskCardProps } from "./types";
import { SubTasks } from "./components/SubTasks";
import { TaskInfo } from "./components/TaskInfo";
import styles from "./TaskCard.module.scss";
import { useLocale } from "next-intl";
import { Locales, parseLocaledText } from "starton-periphery";

export function TaskCard({ task }: TaskCardProps) {
  const locale = useLocale();

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
              title={parseLocaledText(task.name).get(locale as Locales) || task.name}
              completed={task.completed}
              reward={task.rewardTickets}
              open={open}
              disabled={task.completed}
            />
          </DisclosureButton>

          <DisclosurePanel static style={{ width: "100%" }}>
            {({ open }) => (
              <SubTasks 
                subTasks={parseLocaledText(task.description).get(locale as Locales) || task.description} 
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
