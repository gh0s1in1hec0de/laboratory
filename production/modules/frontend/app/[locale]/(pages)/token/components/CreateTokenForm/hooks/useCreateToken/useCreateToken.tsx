import { getErrorText } from "@/utils/getErrorText";
import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { FormikHelpers } from "formik";
import { CreateTokenFormFields, MarketingSupportTabsValues } from "./types";
import { launchService } from "@/services";
import { jettonToNano, toPct, TxRequestBuilder } from "starton-periphery";
import { useRouter } from "next/navigation";
import { useTonConnectUI } from "@tonconnect/ui-react";

export function useCreateToken() {
  const t = useTranslations("Token.submitButton");
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [tonConnectUI] = useTonConnectUI();
  const router = useRouter();
  const locale = useLocale();
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

      console.log("metadataJsonCID", metadataJsonCID);

      // send transaction
      const tx = TxRequestBuilder.createLaunch(
        {
          coreAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
        },
        {
          totalSupply: jettonToNano(values.totalSupply),
          platformSharePct: toPct(values.marketingSupportEnabled ? values.marketingSupportValue : 0),
          metadata: {
            uri: `https://ipfs.io/ipfs/${metadataJsonCID}`
          },
          maybePackedConfig: null,
        },
      );

      const txRes = await tonConnectUI.sendTransaction(tx, { modals: "all" });

      console.log("txRes", txRes.boc);

      // console.log("txRequest", {
      //   coreAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!,
      // },
      // {
      //   totalSupply: jettonToNano(values.totalSupply),
      //   platformSharePct: toPct(values.marketingSupportEnabled ? values.marketingSupportValue : 0),
      //   metadata: {
      //     uri: `${process.env.NEXT_PUBLIC_DEFAULT_IPFS_PATH}PIZDA`
      //   },
      //   maybePackedConfig: null,
      // },
      // );

      // router.replace(`/${locale}/token/123`);
    } catch (error) {
      setErrorText(getErrorText(error, t("creatingError")));
    } finally {
      setSubmitting(false);
    }
  }

  // function onSubmitForm() {
  //   console.log("onSubmitForm");
  // }

  return {
    isLoadingPage,
    onSubmitForm,
    errorText,
  };
}
