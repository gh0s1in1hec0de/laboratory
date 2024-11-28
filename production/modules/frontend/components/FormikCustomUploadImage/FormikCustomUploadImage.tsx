import { useField } from "formik";
import { FormikCustomUploadImageProps } from "./types";
import { CustomUploadImage } from "@/common/CustomUploadImage";
import Grid from "@mui/material/Grid2";
import { CustomAvatar } from "@/common/CustomAvatar";
import { useState } from "react";

export function FormikCustomUploadImage({
  name,
  label,
  changeLabel,
  id,
  alt,
  disabled,
}: FormikCustomUploadImageProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [
    { value },
    { touched, error, initialValue },
    { setValue, setTouched },
  ] = useField(name);

  function handleFileChange(file: File) {
    if (file) {
      convertToBase64(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  function convertToBase64(file: File) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (reader.result) {
        setValue(reader.result.toString());
      }
    };
    reader.onerror = (error) => {
      console.error("Error converting file to Base64:", error);
    };
  }
  
  return (
    <Grid
      container
      width="100%"
      justifyContent="center"
      gap={1}
    >
      <CustomAvatar
        size="large"
        src={previewUrl}
        alt={alt}
      />

      <Grid container size={12} justifyContent="center">
        <CustomUploadImage
          handleFileChange={handleFileChange}
          id={id}
          label={value ? changeLabel : label}
          formikErrorText={error && touched ? error : ""}
          disabled={disabled}
        />
      </Grid>
    </Grid>
  );
}
