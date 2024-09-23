"use client";

import { CustomButton } from "@/common/CustomButton";
import { CustomDropdown } from "@/common/CustomDropdown";
import { Label } from "@/common/Label";
import { CustomConnectButtonProps } from "./types";
import Skeleton from "@mui/material/Skeleton";
import { useConnectButton } from "./hooks/useConnectButton";

export function CustomConnectButton({ title, successChildren }: CustomConnectButtonProps) {
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

  return (
    <>
      {tonWalletAddress && successChildren ? (
        successChildren 
      ) : tonWalletAddress && !successChildren ? (
        // todo: dropdown
        <CustomButton
          background="orange"
          onClick={handleDisconnectWallet}
          padding="10px 0"
          fullWidth
        >
          <Label label={formatAddress(tonWalletAddress)} variantSize="medium14" />
        </CustomButton>
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

