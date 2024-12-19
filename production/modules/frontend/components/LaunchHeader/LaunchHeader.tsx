import Grid from "@mui/material/Grid2";
import { LaunchHeaderInfoProps, LaunchHeaderProps } from "./types";
import { CustomAvatar } from "@/common/CustomAvatar";
import { MainInfo } from "./components/MainInfo";
import { LaunchLinks } from "./components/LaunchLinks";
import { TwitterIcon, TelegramIcon, WebsiteIcon } from "@/icons";
import { LaunchPrice } from "./components/LaunchPrice";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { Address } from "@ton/core";

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
  showPrice,
  launchAddress,
  timings,
  version,
  tradingStats
}: LaunchHeaderProps) {

  async function handleCopyLaunchLink() {
    try {
      retrieveLaunchParams();
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_MINIAPP_URL}?startapp=launch_${Address.parse(launchAddress || "").toString()}`);
    } catch (error) {
      const currentUrl = window.location.href;
  
      navigator.clipboard.writeText(currentUrl).then(() => {
        console.log("URL copied to clipboard:", currentUrl);
      }).catch((err) => {
        console.error("Failed to copy URL to clipboard:", err);
      });
    }
  }

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

      {showBIO && <LaunchLinks linksArray={linksArray} getLaunchLink={handleCopyLaunchLink}/>}

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
