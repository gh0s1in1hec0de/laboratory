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
  const t = useTranslations("Tasks.header");

  if (error) {
    return <Label label={error} variantSize="medium14" color="red" />;
  }

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

