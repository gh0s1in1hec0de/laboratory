import { CALLER_ADDRESS, REFERRAL } from "@/constants";
import { useToggle } from "@/hooks";
import { userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import { initInitData, retrieveLaunchParams, useLaunchParams } from "@telegram-apps/sdk-react";
import { Address } from "@ton/core";
import { useIsConnectionRestored, useTonConnectUI } from "@tonconnect/ui-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export function useConnectButton() {
  const searchParams = useSearchParams();
  const [tonConnectUI] = useTonConnectUI();
  const connectionRestored = useIsConnectionRestored();
  const [isPending, startTransition] = useTransition();
  const [tonWalletAddress, setTonWalletAddress] = useState<string | null>(localStorageWrapper.get(CALLER_ADDRESS));
  const [error, setError] = useState<string | null>(null);
  const [openToast, toggleOpenToast] = useToggle();
  const [toastText, setToastText] = useState("");
  const t = useTranslations("");

  async function handleConnectWallet(address: string) {
    localStorageWrapper.set(CALLER_ADDRESS, address);

    try {
      await userService.postConnectWallet(address, localStorageWrapper.get(REFERRAL) || "");
      setTonWalletAddress(address);
      console.debug("Wallet connected!");
    } catch (error) {
      console.error("Error connecting wallet: ", error);
      // await userService.postConnectWallet(address, decodeURIыComponent(searchParams.get(REFERRAL) || ""));
      // setTonWalletAddress(address);
      // console.debug("Wallet connected!");
    }
  }

  async function handleDisconnectWallet() {
    localStorageWrapper.remove(CALLER_ADDRESS);
    setTonWalletAddress(null);
    console.debug("Wallet disconnected!");
  }

  useEffect(() => {
    // test when dev
    // const initDataRaw = new URLSearchParams([
    //   ["user", JSON.stringify({
    //     id: 99281932,
    //     first_name: "Andrew",
    //     last_name: "Rogue",
    //     username: "rogue",
    //     language_code: "en",
    //     is_premium: true,
    //     allows_write_to_pm: true,
    //   })],
    //   ["hash", "89d6079ad6762351f38c6dbbc41bb53048019256a9443988af7a48bcad16ba31"],
    //   ["auth_date", "1716922846"],
    //   ["start_param", "debug"],
    //   ["chat_type", "sender"],
    //   ["chat_instance", "8428209589180549439"],
    // ]).toString();

    // mockTelegramEnv({
    //   themeParams: {
    //     accentTextColor: "#6ab2f2",
    //     bgColor: "#17212b",
    //     buttonColor: "#5288c1",
    //     buttonTextColor: "#ffffff",
    //     destructiveTextColor: "#ec3942",
    //     headerBgColor: "#17212b",
    //     hintColor: "#708499",
    //     linkColor: "#6ab3f3",
    //     secondaryBgColor: "#232e3c",
    //     sectionBgColor: "#17212b",
    //     sectionHeaderTextColor: "#6ab3f3",
    //     subtitleTextColor: "#708499",
    //     textColor: "#f5f5f5",
    //   },
    //   initData: parseInitData(initDataRaw),
    //   initDataRaw,
    //   version: "7.2",
    //   platform: "tdesktop",
    // });

    const referral = localStorageWrapper.get(REFERRAL);

    if (!referral) {
      try {
        const { startParam } = retrieveLaunchParams();
        localStorageWrapper.set(REFERRAL, startParam || "");
      } catch (error) {
        const referral = decodeURIComponent(searchParams.get(REFERRAL) || "");
        localStorageWrapper.set(REFERRAL, referral);
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

  function handleCopyReferral(address: string) {
    try {
      retrieveLaunchParams();
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_MINIAPP_URL}?startapp=${Address.parse(address).toString()}`);
    } catch (error) {
      navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_BROWSER_URL}/?referral=${Address.parse(address).toRawString()}`);
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
