export interface SubQuest {
  name: string;
  description: string;
}

export interface QuestCard {
  title: string;
  description: string;
  subQuests: SubQuest[];
}

export interface Tab<T> {
  label: string;
  content?: T[];
}

export interface QuestTabProps {
  content?: QuestCard[];
  index: number;
}
