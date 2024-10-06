"use client";

import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useConnectButton } from "./hooks/useConnectButton";
import { CustomConnectButtonProps } from "./types";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { ConnectButtonSkeleton } from "./components/ConnectButtonSkeleton";
import { useTranslations } from "next-intl";
import { CustomDropdown } from "@/common/CustomDropdown";
import { DropdownButton } from "./components/DropdownButton";

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
    handleCopyAddress,
    handleCopyReferral
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
          <CustomDropdown 
            Button={
              <DropdownButton 
                smallAddress={formatAddress(tonWalletAddress)} 
              />
            }
            items={[
              {
                label: "Tasks.header.copyAddress",
                onClick: () => handleCopyAddress(tonWalletAddress),
              },
              {
                label: "Tasks.header.copyReferral",
                onClick: () => handleCopyReferral(tonWalletAddress),
              },
              {
                label: "Tasks.header.disconnectWallet",
                onClick: () => handleClickDisconnectButton(),
              },
            ]}
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

