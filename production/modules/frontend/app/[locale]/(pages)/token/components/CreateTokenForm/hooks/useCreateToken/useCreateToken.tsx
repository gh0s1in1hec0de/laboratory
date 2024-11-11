import { getErrorText } from "@/utils/getErrorText";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { FormikHelpers } from "formik";
import { CreateTokenFormFields } from "./types";

export function useCreateToken() {
  const t = useTranslations("Token.submitButton");
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
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
    // setOpenToast(false);
    
    try {
      
      // await launchService.createToken(data);
    } catch (error) {
      // setOpenToast(true);
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
