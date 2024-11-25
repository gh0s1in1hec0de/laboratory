import { Label } from "@/common/Label";
import { ArrowDownDirectionIcon } from "@/icons";
import { classNames } from "@/utils";
import { IconButton } from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import styles from "./MainBox.module.scss";
import { MainBoxBgColor, MainBoxProps, MainBoxRounded } from "./types";

export function MainBox({
  className,
  children,
  bgColor = MainBoxBgColor.Transparent,
  rounded = MainBoxRounded.None,
  fullWidth = false,
  showMoreRewards = false,
  isOpen = false,
  paddingY,
  paddingX,
  padding,
  ...otherProps
}: MainBoxProps) {
  const t = useTranslations("CurrentLaunch.rewards");

  return (
    <Grid
      className={classNames(
        styles.mainBox,
        {
          [styles.fullWidth]: fullWidth
        },
        [styles[bgColor], styles[rounded], className]
      )}
      paddingY={showMoreRewards ? 0 : paddingY}
      paddingX={showMoreRewards ? 0 : paddingX}
      padding={showMoreRewards ? 0 : padding}
      container
      {...otherProps}
    >
      {showMoreRewards ? (
        <>
          <Grid
            container
            width="100%"
            paddingY={paddingY}
            paddingX={paddingX}
            padding={padding}
          >
            {children}
          </Grid>

          <Grid
            container
            width="100%"
            height="60px"
            justifyContent="center"
            position="relative"
          >
            <Grid container size={12} paddingTop={0.5}>
              <div style={{ width: "100%", height: "1px", backgroundColor: "var(--gray-dark)" }} />
            </Grid>

            <Label
              label={isOpen ? t("lessRewards") : t("moreRewards")}
              variantSize="regular14"
              paddingTop={0.5}
            />

            <IconButton className={styles.arrowDown}>
              <ArrowDownDirectionIcon isRotate={isOpen} />
            </IconButton>
          </Grid>
        </>
      ) : children}
    </Grid>
  );
}
