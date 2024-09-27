"use client";

import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import Skeleton from "@mui/material/Skeleton";
import { useConnectButton } from "./hooks/useConnectButton";
import { CustomConnectButtonProps } from "./types";

export function CustomConnectButton({ title, successChildren, disconnectLabel }: CustomConnectButtonProps) {
  const {
    isPending,
    tonWalletAddress,
    handleConnectWallet,
    handleDisconnectWallet,
    formatAddress,
    connectionRestored,
  } = useConnectButton();

  if (isPending || !connectionRestored) {
    return (
      <Skeleton
        sx={{ bgcolor: "var(--skeleton-color)" }}
        variant="rounded"
        width="100%"
        height="40px"
      />
    );
  }

  console.log(tonWalletAddress);

  if (tonWalletAddress) {
    // POST CONNECT WALLET
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

  function getDisconnectButton(tonWalletAddress: string) {
    return (
      <CustomButton
        background="orange"
        onClick={handleDisconnectWallet}
        padding="10px 0"
        fullWidth
      >
        <Label 
          label={`${disconnectLabel}: ${formatAddress(tonWalletAddress)}`} 
          variantSize="medium14" 
        />
      </CustomButton>
    );
  }
  return (
    <>
      {tonWalletAddress && successChildren ? (
        <>
          {getDisconnectButton(tonWalletAddress)}
          {successChildren}
        </>
      ) : tonWalletAddress && !successChildren ? (
        // todo: dropdown
        getDisconnectButton(tonWalletAddress)
      ) : (
        <CustomButton
          background="orange"
          onClick={handleConnectWallet}
          padding="10px 0"
          fullWidth
        >
          <Label label={title} variantSize="medium14" />
        </CustomButton>
      )}
    </>
  );
}

