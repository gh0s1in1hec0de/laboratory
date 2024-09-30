"use client";

import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useConnectButton } from "./hooks/useConnectButton";
import { CustomConnectButtonProps } from "./types";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { ConnectButtonSkeleton } from "./components/ConnectButtonSkeleton";
import { CurrentWalletButton } from "./components/CurrentWalletButton";
import { useTranslations } from "next-intl";

export function CustomConnectButton({ 
  successChildren, 
}: CustomConnectButtonProps) {
  const {
    isPending,
    tonWalletAddress,
    handleClickConnectButton,
    handleClickDisconnectButton,
    formatAddress,
    connectionRestored,
    error,
  } = useConnectButton();
  const t = useTranslations("Quests.header");

  if (error) {
    return <Label label={error} variantSize="medium14" color="red" />;
  }

  // if (connectionRestored) {
  //   return (
  //     <CustomButton
  //       background="orange"
  //       onClick={handleDisconnectWallet}
  //       padding="10px 0"
  //       fullWidth
  //     >
  //       <Label label={formatAddress(tonWalletAddress)} variantSize="medium14" />
  //     </CustomButton>
  //   );
  // }
  // try {
  //   retrieveLaunchParams();
  // } catch (error) {
  //   return (
  //     <LoginButton
  //       botUsername={"starton_sender_bot"}
  //       buttonSize="large" // "large" | "medium" | "small"
  //       cornerRadius={5} // 0 - 20
  //       showAvatar={false} // true | false
  //       lang="en"
  //       onAuthCallback={setTelegramData}
  //     />
  //   );
  // }

  // function handleShare() {
  //   const inviteLink = `${INVITE_URL}?startapp=${launchParams.initData?.user?.id}`;
  //   const shareText = "Join me on this awesome Telegram mini app!";
  //   const fullUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;
  //   utils.openTelegramLink(inviteLink);
  // }

  return (
    <LoadingWrapper 
      isLoading={isPending || !connectionRestored}
      skeleton={<ConnectButtonSkeleton />}
    >
      {tonWalletAddress ? (
        <>
          <CurrentWalletButton
            handleDisconnectWallet={handleClickDisconnectButton}
            disconnectLabel={t("disconnectWallet")}
            smallAddress={formatAddress(tonWalletAddress)}
          />
          {successChildren || null}
        </>
      ) : (
        <CustomButton
          background="orange"
          onClick={handleClickConnectButton}
          padding="10px 0"
          fullWidth
        >
          <Label label={t("connectWallet")} variantSize="medium14" />
        </CustomButton>
      )}
    </LoadingWrapper>
  );
}

