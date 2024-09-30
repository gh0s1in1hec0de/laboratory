import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { CurrentWalletButtonProps } from "./types";

export function CurrentWalletButton({
  handleDisconnectWallet,
  disconnectLabel,
  smallAddress
}: CurrentWalletButtonProps) {
  return (
    <CustomButton
      background="orange"
      onClick={handleDisconnectWallet}
      padding="10px 0"
      fullWidth
    >
      <Label 
        label={`${disconnectLabel}: ${smallAddress}`} 
        variantSize="medium14" 
      />
    </CustomButton>
  );
}
