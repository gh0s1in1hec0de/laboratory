import { CALLER_ADDRESS, REFERRAL } from "@/constants";
import { useToggle } from "@/hooks";
import { userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import { retrieveLaunchParams } from "@telegram-apps/sdk-react";
import { Address } from "@ton/core";
import { useIsConnectionRestored, useTonConnectUI } from "@tonconnect/ui-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Caller } from "starton-periphery";

export function useConnectButton() {
  const searchParams = useSearchParams();
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();
  const [isPending, startTransition] = useTransition();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(localStorageWrapper.get(CALLER_ADDRESS));
  const [error, setError] = useState<string | null>(null);
  const [openToast, toggleOpenToast] = useToggle();
  const [toastText, setToastText] = useState("");
  const [callerData, setCallerData] = useState<Caller | null>(null);
  const t = useTranslations("");

  async function handleConnectWallet(address: string) {
    localStorageWrapper.set(CALLER_ADDRESS, address);

    try {
      await userService.postConnectWallet(address, localStorageWrapper.get(REFERRAL));
      setTonWalletAddress(address);
      console.debug("Wallet connected!");
      const callerData = await userService.getCaller(address);
      setCallerData(callerData);
    } catch (error) {
      console.error("Error connecting wallet: ", error);
    }
  }

  async function handleDisconnectWallet() {
    localStorageWrapper.remove(CALLER_ADDRESS);
    setTonWalletAddress(null);
    console.debug("Wallet disconnected!");
  }


  useEffect(() => {
    const referral = localStorageWrapper.get(REFERRAL);

    try {
      const { startParam } = retrieveLaunchParams();

      if (!referral && startParam && startParam.startsWith("referral_")) {
        const referralId = startParam.replace("referral_", "");
        localStorageWrapper.set(REFERRAL, referralId);
      }
    } catch (error) {
      if (!referral) {
        const referralParam = decodeURIComponent(searchParams.get(REFERRAL) || "");
        if (referralParam.startsWith("referral_")) {
          const referralId = referralParam.replace("referral_", "");
          localStorageWrapper.set(REFERRAL, referralId);
        }
      }
    }

    (async () => {
      try {
        if (tonConnectUI.account?.address) {
          await handleConnectWallet(tonConnectUI.account.address);
        } else {
          await handleDisconnectWallet();
        }
      } catch (error) {
        setError(getErrorText(error, "Tasks.header.error"));
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
        setError(getErrorText(error, "Tasks.header.error"));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [tonConnectUI]);

  async function handleClickConnectButton() {
    startTransition(() => {
      (async () => {
        try {
          await tonConnectUI.openModal();
        } catch (error) {
          console.error(error);
        }
      })();
    });
  }

  async function handleClickDisconnectButton() {
    startTransition(() => {
      (async () => {
        try {
          await tonConnectUI.disconnect();
        } catch (error) {
          console.error(error);
        }
      })();
    });
  }

  function formatAddress(address: string) {
    const tempAddress = Address.parse(address).toString();
    return `${tempAddress.slice(0, 4)}...${tempAddress.slice(-4)}`;
  }

  function handleCopyAddress(address: string) {
    navigator.clipboard.writeText(Address.parse(address).toRawString());
    setToastText(t("Tasks.header.successCopyAddress"));
    toggleOpenToast();
  }

  function handleCopyReferral() {
    // try {
    //   retrieveLaunchParams();
    //   navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_MINIAPP_URL}?startapp=${Address.parse(address).toString()}`);
    // } catch (error) {
    //   navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_BROWSER_URL}/?referral=${Address.parse(address).toRawString()}`);
    // } finally {
    //   setToastText(t("Tasks.header.successCopyReferral"));
    //   toggleOpenToast();
    // }

    try {
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_MINIAPP_URL}?startapp=referral_${callerData?.callerId}`);
    } catch (error) {
      console.error(error);
    } finally {
      setToastText(t("Tasks.header.successCopyReferral"));
      toggleOpenToast();
    }
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
    handleCopyReferral,
    openToast,
    toggleOpenToast,
    toastText
  };
}
