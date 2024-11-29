import Grid from "@mui/material/Grid2";
import { LaunchHeaderInfoProps, LaunchHeaderProps } from "./types";
import { CustomAvatar } from "@/common/CustomAvatar";
import { MainInfo } from "./components/MainInfo";
import { LaunchLinks } from "./components/LaunchLinks";
import { TwitterIcon, TelegramIcon, WebsiteIcon } from "@/icons";
import { LaunchPrice } from "./components/LaunchPrice";

export function LaunchHeader({
  avatarSrc,
  symbol,
  name,
  holders,
  showHolders,
  showBIO,
  xLink,
  telegramLink,
  websiteLink,
  getLaunchLink,
  showPrice,
  launchAddress,
  timings,
  version,
  tradingStats
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
        src={avatarSrc}
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

      {showPrice && timings && version && (
        <LaunchPrice
          tradingStats={tradingStats}
          launchAddress={launchAddress || ""}
          timings={timings}
          version={version}
        />
      )}

      <Grid container size={12} paddingTop={0.5}>
        <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
      </Grid>
    </Grid>
  );
}
