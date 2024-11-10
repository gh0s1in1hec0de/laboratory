import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useFormikContext } from "formik";
import { CreateTokenFormFields } from "../../hooks/useCreateToken";
import { CREATE_TOKEN_FORM_ID } from "../../constants";
import { useTranslations } from "next-intl";
import Grid from "@mui/material/Grid2";

export function SubmitButton() {
  const t = useTranslations("Token.submitButton");
  const { errors, isSubmitting } = useFormikContext<CreateTokenFormFields>();

  return (
    <Grid
      container
      width="100%"
      gap={1}
    >
      <CustomButton
        form={CREATE_TOKEN_FORM_ID}
        type="submit"
        padding="10px 6px"
        // disabled={Object.keys(errors).length > 0 || isSubmitting}
        disabled={isSubmitting}
        fullWidth
      >
        <Label
          label={isSubmitting ? t("loading") : t("label")}
          variantSize="medium16"
          offUserSelect
        />
      </CustomButton>
      <Label
        label={t("description")}
        variantSize="regular14"
        variantColor="gray"
        offUserSelect
      />
    </Grid>
  );
}
