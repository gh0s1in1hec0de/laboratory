import Grid from "@mui/material/Grid2";
import { LaunchLinksProps } from "./types";
import { MainBox } from "@/common/MainBox";
import { IconButton } from "@mui/material";
import { ShareIcon } from "@/icons";
import { CustomToast } from "@/common/CustomToast";
import { useToggle } from "@/hooks";
import { useTranslations } from "next-intl";

export function LaunchLinks({ linksArray, getLaunchLink }: LaunchLinksProps) {
  const [openToast, toggleOpenToast] = useToggle(false);
  const t = useTranslations("CurrentLaunch");

  function onClickLaunchLink(link?: string) {
    if (link) {
      window.open(link, "_blank");
    }
  }

  function onClickCopyLink() {
    getLaunchLink?.();
    toggleOpenToast();
  }

  return (
    <Grid 
      container
      gap={0.5}
    >
      {linksArray.map(({ link, Icon }, index) => (
        <IconButton
          key={index}
          disabled={!link}
          onClick={() => onClickLaunchLink(link)}
        >
          <MainBox
            rounded="xl"
            paddingX={2}
            paddingY={1.5}
          >
            <Icon disabled={!link}/>
          </MainBox>
        </IconButton>
      ))}

      <IconButton onClick={onClickCopyLink}>
        <MainBox
          rounded="xl"
          paddingX={2}
          paddingY={1.5}
        >
          <ShareIcon />
        </MainBox>
      </IconButton>

      <CustomToast
        open={openToast}
        toggleOpen={toggleOpenToast}
        text={t("successCopy")}
        severity="success"
      />
    </Grid>
  );
}
