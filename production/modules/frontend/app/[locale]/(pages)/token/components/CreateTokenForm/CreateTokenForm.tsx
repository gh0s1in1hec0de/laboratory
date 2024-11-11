"use client";

import { Label } from "@/common/Label";
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

export function CreateTokenForm() {
  const {
    isLoadingPage,
    onSubmitForm,
    errorText,
  } = useCreateToken();

  return (
    <LoadingWrapper
      isLoading={isLoadingPage}
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
            {/* todo add toasts */}
            {/* <Snackbar
              open={openToast}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              // autoHideDuration={6000}
              sx={{
                justifyContent: "space-between",
              }}
              onClose={handleCloseToast}
              message={errorText}
              action={(
                <>
                  <IconButton
                    style={{
                      marginLeft: "auto",
                    }}
                    size="small"
                    aria-label="close"
                    color="inherit"
                    onClick={handleCloseToast}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </>
              )}
            /> */}
            <UploadImage />
            <MetadataInfo />
            <SupplyInfo />
            <SocialMediaInfo />
            <MarketingSupportInfo />
            <InfluencerSupportInfo />
            <Descriptions />
            {errorText && (
              <Label
                label={errorText}
                variantSize="regular14"
                variantColor="red"
                offUserSelect
              />
            )}
            <SubmitButton />
          </Grid>
        </Form>
      </Formik>
    </LoadingWrapper>
  );
}
