"use client";

import { LoadingWrapper } from "@/common/LoadingWrapper";
import Grid from "@mui/material/Grid2";
import { Form, Formik } from "formik";
import { Descriptions } from "./components/Descriptions";
import { InfluencerSupportInfo } from "./components/InfluencerSupportInfo";
import { MarketingSupportInfo } from "./components/MarketingSupportInfo";
import { MetadataInfo } from "./components/MetadataInfo";
import { SocialMediaInfo } from "./components/SocialMediaInfo";
import { SubmitButton } from "./components/SubmitButton";
import { SupplyInfo } from "./components/SupplyInfo";
import { UploadImage } from "./components/UploadImage";
import { CREATE_TOKEN_FORM_ID } from "./constants";
import { getValidationSchema, initialValues, useCreateToken } from "./hooks/useCreateToken";
import { CustomToast } from "@/common/CustomToast";
import { CreateTokenFormSkeleton } from "./components/CreateTokenFormSkeleton";
import { useTranslations } from "next-intl";

export function CreateTokenForm() {
  const t = useTranslations("Token.submitButton");
  const {
    isLoadingPage,
    onSubmitForm,
    errorText,
    isErrorToast,
    toggleIsErrorToast,
    isSuccessToast,
    toggleIsSuccessToast,
    callerData,
  } = useCreateToken();

  return (
    <LoadingWrapper
      isLoading={isLoadingPage}
      skeleton={<CreateTokenFormSkeleton/>}
    >
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmitForm}
        validationSchema={getValidationSchema}
      >
        <Form id={CREATE_TOKEN_FORM_ID} style={{ width: "100%" }}>
          <Grid
            container
            width="100%"
            gap={3}
            paddingTop={3}
          >
            <UploadImage />
            <MetadataInfo />
            <SupplyInfo />
            <SocialMediaInfo />
            <MarketingSupportInfo />
            <InfluencerSupportInfo />
            <Descriptions />
            <CustomToast
              open={isErrorToast || isSuccessToast}
              text={isErrorToast ? errorText || "" : t("success")}
              severity={isErrorToast ? "error" : "success"}
              toggleOpen={isErrorToast ? toggleIsErrorToast : toggleIsSuccessToast}
            />
            <SubmitButton callerData={callerData} />
          </Grid>
        </Form>
      </Formik>
    </LoadingWrapper>
  );
}
