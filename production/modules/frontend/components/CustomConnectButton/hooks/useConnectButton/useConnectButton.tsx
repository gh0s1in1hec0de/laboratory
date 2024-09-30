import { userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import { Address } from "@ton/core";
import { useIsConnectionRestored, useTonConnectUI } from "@tonconnect/ui-react";
import { useEffect, useState, useTransition } from "react";

export function useConnectButton() {
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();
  const [isPending, startTransition] = useTransition();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(localStorageWrapper.get("address"));
  const [error, setError] = useState<string | null>(null);
  
  async function handleConnectWallet(address: string){
    localStorageWrapper.set("address", address);
    await userService.postConnectWallet(address);
    setTonWalletAddress(address);
    console.debug("Wallet connected!");
  }

  async function handleDisconnectWallet(){
    localStorageWrapper.remove("address");
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

  function formatAddress(address: string) {
    const tempAddress = Address.parse(address).toString();
    return `${tempAddress.slice(0, 4)}...${tempAddress.slice(-4)}`;
  }

  async function handleClickConnectButton() {
    startTransition(async () => {
      try {
        await tonConnectUI.openModal();
      } catch (error) {
        console.error(error);
      }
    });
  }

  // function setTelegramData(data: TelegramAuthData) {
  //   const initDataRaw = new URLSearchParams([
  //     ["user", JSON.stringify({
  //       id: data.id,
  //       first_name: data.first_name,
  //       last_name: data.last_name,
  //       username: data.username,
  //       language_code: locale,
  //     })],
  //     ["hash", data.hash],
  //     ["auth_date", data.auth_date.toString()],
  //   ]).toString();

  //   mockTelegramEnv({
  //     themeParams: {},
  //     initData: parseInitData(initDataRaw),
  //     initDataRaw,
  //     version: "7.10",
  //     platform: "tdesktop",
  //   });
  // }

  async function handleClickDisconnectButton() {
    startTransition(async () => {
      try {
        await tonConnectUI.disconnect();
      } catch (error) {
        console.error(error);
      }
    });
  }

  return {
    isPending,
    connectionRestored,
    tonWalletAddress,
    handleClickConnectButton,
    handleClickDisconnectButton,
    formatAddress,
    error,
  };
}
