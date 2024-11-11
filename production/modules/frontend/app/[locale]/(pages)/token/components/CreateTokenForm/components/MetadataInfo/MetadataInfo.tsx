import { FormikCustomInput } from "@/components/FormikCustomInput";
import { FormikCustomTextarea } from "@/components/FormikCustomTextarea";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { useFormikContext } from "formik";
import { CreateTokenFormFields } from "../../hooks/useCreateToken";

export function MetadataInfo() {
  const t = useTranslations("Token");
  const { isSubmitting } = useFormikContext<CreateTokenFormFields>();

  return (
    <Grid
      container
      width="100%"
      gap={1}
    >
      <Grid container size="grow">
        <FormikCustomInput
          placeholder={t("symbolInput.placeholder")}
          name="symbol"
          disabled={isSubmitting}
        />
      </Grid>

      <Grid container size="grow">
        <FormikCustomInput
          placeholder={t("nameInput.placeholder")}
          name="name"
          disabled={isSubmitting}
        />
      </Grid>

      <FormikCustomTextarea
        name="description"
        placeholder={t("descriptionTextarea.placeholder")}
        fullWidth
        disabled={isSubmitting}
      />
    </Grid>
  );
}
