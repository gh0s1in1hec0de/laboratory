import { getErrorText } from "@/utils/getErrorText";
import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FormikHelpers } from "formik";
import { CreateTokenFormFields, MarketingSupportTabsValues } from "./types";
import { launchService } from "@/services";
import { jettonToNano, toPct, TxRequestBuilder } from "starton-periphery";
import { useRouter } from "next/navigation";
import { useTonConnectUI } from "@tonconnect/ui-react";
import { LAUNCH_ERROR } from "@/errors/launch/launch";
import { CALLER_ADDRESS, PAGES } from "@/constants";
import { localStorageWrapper } from "@/utils";

export function useCreateToken() {
  const t = useTranslations("Token.submitButton");
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const router = useRouter();
  const locale = useLocale();

  // todo add toasts
  // const [openToast, setOpenToast] = useState(false);

  // const handleCloseToast = (
  //   event: React.SyntheticEvent | Event,
  //   reason?: SnackbarCloseReason,
  // ) => {
  //   if (reason === "clickaway") {
  //     return;
  //   }

  //   setOpenToast(false);
  // };

  useEffect(() => {
    (async () => {
      try {
        const creator = localStorageWrapper.get(CALLER_ADDRESS);
        
        if (creator) {
          const tokenLaunch = await launchService.getCurrentToken({
            creator,
          });
  
          if (tokenLaunch) {
            router.replace(`/${locale}/${PAGES.Token}/${PAGES.TokenPolling}?creator=${creator}`);
          }
        }
      } catch (error) {
        console.error(LAUNCH_ERROR.GetTokenLaunch, error);
      } finally {
        setIsLoadingPage(false);
      }
    })();
  }, []);

  async function onSubmitForm(
    values: CreateTokenFormFields,
    { setSubmitting, setStatus }: FormikHelpers<CreateTokenFormFields>
  ) {
    setSubmitting(true);
    setErrorText(null);
    
    try {
      const links = Object.fromEntries(
        Object.entries({
          x: values.x,
          telegram: values.telegram,
          website: values.website,
        }).filter(([_, value]) => value)
      );

      const metadata = {
        name: values.name,
        description: values.description,
        symbol: values.symbol,
        decimals: values.decimals,
      };

      // Qmb4Yjspwz3gVq371wvVN9hqzzAoopzv5W1yS49qdTJJ7f
      const metadataJsonCID = await launchService.saveMetadata({
        links,
        image: values.image,
        metadata,
        influencerSupport: values.influencerSupport,
      });
      // const metadataJsonCID = "Qmb4Yjspwz3gVq371wvVN9hqzzAoopzv5W1yS49qdTJJ7f";
      // console.log("metadataJsonCID", metadataJsonCID);


      const transaction = TxRequestBuilder.createLaunch(
        {
          coreAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        },
        {
          totalSupply: jettonToNano(values.totalSupply),
          platformSharePct: toPct(values.marketingSupportEnabled ? values.marketingSupportValue : 0),
          metadata: {
            uri: `https://ipfs.io/ipfs/${metadataJsonCID}`
          },
          startTime: Math.floor(Date.now() / 1000) + 60,
          maybePackedConfig: null,
        },
      );

      await tonConnectUI.sendTransaction(transaction, { modals: "all" });

      router.replace(`/${locale}/${PAGES.Token}/${PAGES.TokenPolling}?meta=${metadataJsonCID}`);
    } catch (error) {
      setErrorText(getErrorText(error, t("creatingError")));
    } finally {
      setSubmitting(false);
    }
  }

  return {
    isLoadingPage,
    onSubmitForm,
    errorText,
  };
}
