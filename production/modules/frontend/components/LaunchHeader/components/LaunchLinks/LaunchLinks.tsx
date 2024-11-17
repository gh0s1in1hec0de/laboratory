import Grid from "@mui/material/Grid2";
import { LaunchLinksProps } from "./types";
import { MainBox } from "@/common/MainBox";
import { IconButton } from "@mui/material";
import { ShareIcon } from "@/icons";

export function LaunchLinks({ linksArray, getLaunchLink }: LaunchLinksProps) {

  function onClick(link?: string) {
    if (link) {
      window.open(link, "_blank");
    }
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
          onClick={() => onClick(link)}
        >
          <MainBox
            roundedXl
            paddingX={2}
            paddingY={1.5}
          >
            <Icon disabled={!link}/>
          </MainBox>
        </IconButton>
      ))}

      {/* todo: add success copy */}
      <IconButton onClick={() => getLaunchLink?.()}>
        <MainBox
          roundedXl
          paddingX={2}
          paddingY={1.5}
        >
          <ShareIcon />
        </MainBox>
      </IconButton>
    </Grid>
  );
}
