export enum CustomAvatarSize {
  EXTRA_SMALL = "extraSmall",
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large",
}

export interface CustomAvatarProps {
  src?: string | null;
  alt: string;
  size?: `${CustomAvatarSize}`;
}
