import { Box } from "@mui/material";
import styles from "./BgLight.module.scss";
import { BgLightProps } from "./types";

export function BgLight({
  width = "65%",
  height = "150px",
}: BgLightProps) {
  return (
    <Box
      width={width}
      height={height}
      className={styles.background}
    />
  );
}
