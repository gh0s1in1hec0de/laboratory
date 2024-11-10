"use client";

import { LoadingWrapper } from "@/common/LoadingWrapper";
import Grid from "@mui/material/Grid2";
import { Form, Formik } from "formik";
import { InfluencerSupportInfo } from "./components/InfluencerSupportInfo";
import { MarketingSupportInfo } from "./components/MarketingSupportInfo";
import { MetadataInfo } from "./components/MetadataInfo";
import { SocialMediaInfo } from "./components/SocialMediaInfo";
import { SubmitButton } from "./components/SubmitButton";
import { SupplyInfo } from "./components/SupplyInfo";
import { initialValues, useCreateToken } from "./hooks/useCreateToken";
import { CREATE_TOKEN_FORM_ID } from "./constants";
import { Descriptions } from "./components/Descriptions";
import { ChangeEvent, useState } from "react";
import { UploadImage } from "./components/UploadImage";

export function CreateTokenForm() {
  const {
    isLoading,
    onSubmitForm,
  } = useCreateToken();
  // const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // const [base64, setBase64] = useState<string | null>(null);
  // const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // // Обработчик выбора файла
  // const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (file) {
  //     setSelectedFile(file);
  //     convertToBase64(file);
  //     setPreviewUrl(URL.createObjectURL(file)); // Создаем URL для предварительного просмотра
  //   }
  // };

  // // Преобразование файла в Base64
  // const convertToBase64 = (file: File) => {
  //   const reader = new FileReader();
  //   reader.readAsDataURL(file);
  //   reader.onload = () => {
  //     if (reader.result) {
  //       setBase64(reader.result.toString()); // Устанавливаем строку Base64
  //     }
  //   };
  //   reader.onerror = (error) => {
  //     console.error("Ошибка при преобразовании файла в Base64:", error);
  //   };
  // };

  // console.log(selectedFile);
  // console.log(previewUrl);
  // console.log(base64);
  
  return (
    <LoadingWrapper
      isLoading={isLoading}
    >
      <Formik
        initialValues={initialValues}
        onSubmit={onSubmitForm}
        // validationSchema={getValidationSchema}
        // enableReinitialize
      >
        <Form id={CREATE_TOKEN_FORM_ID} style={{ width: "100%" }}>
          <Grid
            container
            width="100%"
            gap={3}
          >
            {/* <label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
      
            {previewUrl && 
              <img src={previewUrl} alt="Avatar Preview" style={{ width: "100px", height: "100px", borderRadius: "50%" }} />
            } */}

            <UploadImage />
            <MetadataInfo />
            <SupplyInfo />
            <SocialMediaInfo />
            <MarketingSupportInfo />
            <InfluencerSupportInfo />
            <Descriptions />
            <SubmitButton />
          </Grid>
        </Form>
      </Formik>
    </LoadingWrapper>
  );
}
