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
        disabled={isSubmitting}
      />
    </Grid>
  );
}
