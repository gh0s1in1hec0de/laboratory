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

export function CreateTokenForm() {
  const {
    isLoading,
    onSubmitForm,
  } = useCreateToken();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Обработчик выбора файла
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      // Создаем URL для предварительного просмотра изображения
      const preview = URL.createObjectURL(file);
      setPreviewUrl(preview);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Пожалуйста, выберите файл");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", selectedFile); // 'avatar' - это название поля, которое сервер ожидает для файла

    try {
      const response = await axios.post("/api/upload-avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Файл успешно загружен:", response.data);
    } catch (error) {
      console.error("Ошибка при загрузке файла:", error);
    }
  };

  console.log(selectedFile);
  console.log(previewUrl);
  
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
            <label>
            Загрузить аватар:
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
      
            {/* Предварительный просмотр изображения */}
            {previewUrl && <img src={previewUrl} alt="Avatar Preview" style={{ width: "100px", height: "100px", borderRadius: "50%" }} />}

            <MetadataInfo />
            <SupplyInfo />
            <SocialMediaInfo />
            {/* <MarketingSupportInfo /> */}
            <InfluencerSupportInfo />
            <Descriptions />
            <SubmitButton />
          </Grid>
        </Form>
      </Formik>
    </LoadingWrapper>
  );
}
