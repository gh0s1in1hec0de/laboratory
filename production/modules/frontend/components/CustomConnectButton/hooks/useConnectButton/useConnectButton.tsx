import { CALLER_ADDRESS, REFERRAL } from "@/constants";
import { useToggle } from "@/hooks";
import { userService } from "@/services";
import { getErrorText, localStorageWrapper } from "@/utils";
import { initInitData, retrieveLaunchParams, useLaunchParams } from "@telegram-apps/sdk-react";
import { Address } from "@ton/core";
import { useIsConnectionRestored, useTonConnectUI } from "@tonconnect/ui-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
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
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("");

  async function handleConnectWallet(address: string) {
    localStorageWrapper.set(CALLER_ADDRESS, address);

    try {
      await userService.postConnectWallet(address, localStorageWrapper.get(REFERRAL));
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
    const referral = localStorageWrapper.get(REFERRAL);

    // if (!referral) {
    //   try {
    //     const { startParam } = retrieveLaunchParams();
    //     localStorageWrapper.set(REFERRAL, startParam || "");
    //   } catch (error) {
    //     const referral = decodeURIComponent(searchParams.get(REFERRAL) || "");
    //     localStorageWrapper.set(REFERRAL, referral);
    //   }
    // }

    try {
      const { startParam } = retrieveLaunchParams();
  
      // Проверка на startParam с префиксом "launch_" (приоритет редиректа)
      if (startParam && startParam.startsWith("launch_")) {
        console.log("startParam", startParam);
        const launchAddress = startParam.replace("launch_", "");
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(`/${locale}/${Address.parse(launchAddress).toRawString()}`); // Выполняем редирект для launch_, независимо от реферала
        return; // Завершаем дальнейшую обработку
      }
  
      // Проверка на startParam с префиксом "referral_" (если нет реферала в localStorage)
      if (!referral && startParam && startParam.startsWith("referral_")) {
        const referralId = startParam.replace("referral_", "");
        localStorageWrapper.set(REFERRAL, referralId); // Сохраняем реферал
      }
    } catch (error) {
      // Обработка случая, если параметр передан через searchParams
      if (!referral) {
        const referralParam = decodeURIComponent(searchParams.get(REFERRAL) || "");
        if (referralParam.startsWith("referral_")) {
          const referralId = referralParam.replace("referral_", "");
          localStorageWrapper.set(REFERRAL, referralId); // Сохраняем реферал
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

  async function handleCopyReferral(address: string) {
    try {
      const callerData = await userService.getCaller(address);

      try {
        retrieveLaunchParams();
        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_MINIAPP_URL}?startapp=referral_${callerData.callerId}`);
      } catch (error) {
        navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_FRONTEND_BROWSER_URL}/?referral=${callerData.callerId}`);
      } finally {
        setToastText(t("Tasks.header.successCopyReferral"));
        toggleOpenToast();
      }
    } catch (error) {
      console.error(error);
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
