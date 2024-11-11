import { BgLight } from "@/common/BgLight";
import { FormikCustomUploadImage } from "@/components/FormikCustomUploadImage";
import Grid from "@mui/material/Grid2";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { CreateTokenFormFields } from "../../hooks/useCreateToken";

export function UploadImage() {
  const t = useTranslations("Token.imageInput");
  const { isSubmitting } = useFormikContext<CreateTokenFormFields>();

  return (
    <Grid container width="100%" justifyContent="center">
      <BgLight />

      <FormikCustomUploadImage
        name="image"
        label={t("label")}
        changeLabel={t("changeLabel")}
        id="token-logo"
        alt="Token Logo"
        altImage="https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"
        disabled={isSubmitting}
      />
    </Grid>
  );
}
