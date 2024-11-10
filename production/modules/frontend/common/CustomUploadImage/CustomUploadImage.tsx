import { ChangeEvent, useState } from "react";
import { Label } from "../Label";
import { CustomUploadImageProps } from "./types";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import styles from "./CustomUploadImage.module.scss";
import { classNames } from "@/utils";

export function CustomUploadImage({
  handleFileChange,
  id,
  label,
  formikErrorText,
  disabled,
}: CustomUploadImageProps) {
  const t = useTranslations("");
  const [errorText, setErrorText] = useState("");

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    setErrorText("");

    const file = event.target.files?.[0];

    if (file) {
      if (file.type.startsWith("image/")) {
        handleFileChange(file);
      } else {
        setErrorText(t("Token.imageInput.errors.invalid"));
      }
    }
  }
  
  return (
    <Grid container flexDirection="column" alignItems="center" gap={0.5}>
      <input
        accept="image/*"
        id={id}
        className={styles.input}
        type="file"
        onChange={onFileChange}
        disabled={disabled}
      />

      <label 
        htmlFor={id} 
        className={classNames(
          styles.label, 
          {
            [styles.disabled]: disabled,
          }
        )}
      >
        <Label 
          label={label}
          variantColor="orange"
          variantSize="regular14" 
          disabled={disabled}
          offUserSelect
        />
      </label>

      {(formikErrorText || errorText) && (
        <Label 
          label={t(formikErrorText) || errorText} 
          variantColor="red" 
          variantSize="regular14"
        />
      )}
    </Grid>
  );
}
