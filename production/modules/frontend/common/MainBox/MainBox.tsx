import { classNames } from "@/utils";
import { MainBoxBgColor, MainBoxProps } from "./types";
import Grid from "@mui/material/Grid2";
import styles from "./MainBox.module.scss";

export function MainBox({
  className,
  children,
  bgColor = MainBoxBgColor.Transparent,
  rounded = false,
  fullWidth = false,
  ...otherProps
}: MainBoxProps) {
  return (
    <Grid
      className={classNames(
        styles.mainBox,
        { 
          [styles.rounded]: rounded,
          [styles.fullWidth]: fullWidth
        },
        [styles[bgColor], className]
      )}
      container
      {...otherProps}
    >
      {children}
    </Grid>
  );
}
