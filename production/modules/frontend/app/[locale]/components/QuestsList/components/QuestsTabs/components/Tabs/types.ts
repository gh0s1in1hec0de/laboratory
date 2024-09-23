export interface SubQuest {
  name: string;
  description: string;
}

export interface QuestCard {
  title: string;
  description: string;
  subQuests: SubQuest[];
}

export interface Tab {
  label: string;
  quests: QuestCard[];
}

export interface TabContentProps {
  quests: QuestCard[];
  index: number;
}
