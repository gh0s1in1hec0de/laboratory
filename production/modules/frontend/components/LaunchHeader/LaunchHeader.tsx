import Grid from "@mui/material/Grid2";
import { LaunchHeaderInfoProps, LaunchHeaderProps } from "./types";
import { CustomAvatar } from "@/common/CustomAvatar";
import { MainInfo } from "./components/MainInfo";
import { LaunchLinks } from "./components/LaunchLinks";
import { LaunchChart } from "./components/LaunchChart";
import { TwitterIcon, TelegramIcon, WebsiteIcon } from "@/icons";

export function LaunchHeader({
  avatarSrc,
  symbol,
  name,
  holders,
  showHolders,
  showBIO,
  showChart,
  xLink,
  telegramLink,
  websiteLink,
  getLaunchLink,
}: LaunchHeaderProps) {

  const linksArray: LaunchHeaderInfoProps[] = [
    {
      link: telegramLink || "",
      Icon: ({ disabled }) => <TelegramIcon disabled={disabled}/>,
    },
    {
      link: xLink || "",
      Icon: ({ disabled }) => <TwitterIcon disabled={disabled}/>,
    },
    {
      link: websiteLink || "",
      Icon: ({ disabled }) => <WebsiteIcon disabled={disabled}/>,
    },
  ];
  
  return (
    <Grid
      container
      width="100%"
      alignItems="center"
      flexDirection="column"
      gap={1.5}
      paddingTop={3}
    >
      <CustomAvatar
        src={avatarSrc || "https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"}
        size="large"
        alt="Launch Avatar"
      />

      <MainInfo
        symbol={`$${symbol || "UNKNWN"}`}
        name={name || "Unknown"}
        holders={holders || 0}
        showHolders={showHolders}
      />

      {showBIO && <LaunchLinks linksArray={linksArray} getLaunchLink={getLaunchLink}/>}

      {showChart && (
        <LaunchChart />
      )}

      <Grid container size={12} paddingTop={0.5}>
        <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
      </Grid>
    </Grid>
  );
}
