import { Address } from "@ton/core";
import { useIsConnectionRestored, useTonConnectUI } from "@tonconnect/ui-react";
import { useEffect, useState, useTransition } from "react";

export function useConnectButton() {
  const [tonConnectUI] = useTonConnectUI();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const connectionRestored = useIsConnectionRestored();

  useEffect(() => {
    (async () => {
      if (tonConnectUI.account?.address) {
        setTonWalletAddress(tonConnectUI.account.address);
      } else {
        setTonWalletAddress(null);
      }
    })();

    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      if (wallet) {
        setTonWalletAddress(wallet.account.address);
        console.log("Wallet connected successfully!");
      } else {
        setTonWalletAddress(null);
        console.log("Wallet disconnected successfully!");
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI]);

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

  function formatAddress(address: string) {
    const tempAddress = Address.parse(address).toString();
    return `${tempAddress.slice(0, 4)}...${tempAddress.slice(-4)}`;
  }

  async function handleConnectWallet() {
    startTransition(async () => {
      try {
        await tonConnectUI.openModal();
        console.log("Wallet connected successfully!");
      } catch (error) {
        console.error(error);
      }
    });
  }

  async function handleDisconnectWallet() {
    startTransition(async () => {
      await tonConnectUI.disconnect();
    });
  }

  return {
    isPending,
    connectionRestored,
    tonWalletAddress,
    handleConnectWallet,
    handleDisconnectWallet,
    formatAddress,
  };
}