import { getErrorText } from "@/utils/getErrorText";
import { useState } from "react";
import { useTranslations } from "next-intl";

export function useCreateToken() {
  const t = useTranslations("");
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function onSubmitForm() {
    setErrorText(null);
    try {
      // await launchService.createToken(data);
    } catch (error) {
      setErrorText(getErrorText(error, t("commonError")));
    } 
  }

  return {
    isLoadingPage,
    onSubmitForm,
  };
}
