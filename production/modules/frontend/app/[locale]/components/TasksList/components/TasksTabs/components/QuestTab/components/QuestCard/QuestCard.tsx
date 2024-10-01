import { DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { MainBox } from "@/common/MainBox";
import { QuestCardProps } from "./types";
import { SubQuests } from "./components/SubQuests";
import { QuestInfo } from "./components/QuestInfo";
import styles from "./QuestCard.module.scss";

export function QuestCard({ task, disabled, open }: QuestCardProps) {
  return (
    <MainBox 
      container
      rounded 
      alignItems="center"
      size={12}
    >
      <DisclosureButton 
        as="div" 
        className={styles.button}
      >
        <QuestInfo 
          title={task.name}
          completed={task.completed}
          reward={task.rewardTickets}
          open={open}
          disabled={disabled}
        />
      </DisclosureButton>

      <DisclosurePanel static style={{ width: "100%" }}>
        {/* {({ open }) => (
          <SubQuests 
            subQuests={task.subTasks} 
            open={open} 
            disabled={disabled}
          />
        )} */}
      </DisclosurePanel>
    </MainBox>
  );
}
