import { Avatar } from "@mui/material";
import { CustomAvatarProps, CustomAvatarSize } from "./types";
import { classNames } from "@/utils/classNames";
import styles from "./CustomAvatar.module.scss";

export function CustomAvatar({
  src,
  alt,
  size = CustomAvatarSize.SMALL,
}: CustomAvatarProps) {
  return (
    <Avatar
      src={src}
      alt={alt}
      classes={{
        root: classNames(styles.root, {}, [styles[size]]),
        // img: classNames(styles.img, {}, [styles[size]]),
      }}
    />
  );
}