import { FormikCustomInput } from "@/components/FormikCustomInput";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { useFormikContext } from "formik";
import { CreateTokenFormFields } from "../../hooks/useCreateToken";

export function SupplyInfo() {
  const t = useTranslations("Token.totalSupplyInput");
  const { isSubmitting } = useFormikContext<CreateTokenFormFields>();

  return (
    <Grid
      container
      gap={1}
      width="100%"
    >
      <Label 
        label={t("label")} 
        variantSize="semiBold18" 
        offUserSelect
      />

      <FormikCustomInput
        name="totalSupply"
        placeholder={t("placeholder")}
        type="number"
        fullWidth
        disabled={isSubmitting}
      />

      <Label 
        label={t("description")}
        variantSize="regular14"
        variantColor="gray"
        offUserSelect
        cropped
      />
    </Grid>
  );
}
