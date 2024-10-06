import { CALLER_ADDRESS, REFERRAL } from "@/constants";
import { userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import { Address } from "@ton/core";
import { useIsConnectionRestored, useTonConnectUI } from "@tonconnect/ui-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function useConnectButton() {
  const searchParams = useSearchParams();
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();
  const [isPending, startTransition] = useTransition();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(localStorageWrapper.get(CALLER_ADDRESS));
  const [error, setError] = useState<string | null>(null);

  async function handleConnectWallet(address: string){
    localStorageWrapper.set(CALLER_ADDRESS, address);
    await userService.postConnectWallet(address, decodeURIComponent(searchParams.get(REFERRAL) || ""));
    setTonWalletAddress(address);
    console.debug("Wallet connected!");
  }

  async function handleDisconnectWallet(){
    localStorageWrapper.remove(CALLER_ADDRESS);
    setTonWalletAddress(null);
    console.debug("Wallet disconnected!");
  }

  useEffect(() => {
    (async () => {
      try {
        if (tonConnectUI.account?.address) {
          await handleConnectWallet(tonConnectUI.account.address);
        } else {
          await handleDisconnectWallet();
        }
      } catch (error) {
        setError(getErrorText(error, "Quests.header.error"));
      }
    })();

    const unsubscribe = tonConnectUI.onStatusChange(async (wallet) => {
      try {
        if (wallet) {
          await handleConnectWallet(wallet.account.address);
        } else {
          await handleDisconnectWallet();
        }
      } catch (error) {
        setError(getErrorText(error, "Quests.header.error"));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI]);

  async function handleClickConnectButton() {
    startTransition(async () => {
      try {
        await tonConnectUI.openModal();
      } catch (error) {
        console.error(error);
      }
    });
  }

  async function handleClickDisconnectButton() {
    startTransition(async () => {
      try {
        await tonConnectUI.disconnect();
      } catch (error) {
        console.error(error);
      }
    });
  }

  function formatAddress(address: string) {
    const tempAddress = Address.parse(address).toString();
    return `${tempAddress.slice(0, 4)}...${tempAddress.slice(-4)}`;
  }

  function handleCopyAddress(address: string) {
    navigator.clipboard.writeText(Address.parse(address).toString());
  }

  function handleCopyReferral(address: string) {
    navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/?referral=${Address.parse(address).toRawString()}`);
  }

  return {
    isPending,
    connectionRestored,
    tonWalletAddress,
    handleClickConnectButton,
    handleClickDisconnectButton,
    formatAddress,
    error,
    handleCopyAddress,
    handleCopyReferral
  };
}
