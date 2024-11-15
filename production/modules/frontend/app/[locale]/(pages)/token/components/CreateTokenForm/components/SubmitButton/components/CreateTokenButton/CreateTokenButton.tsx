import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { CREATE_TOKEN_FORM_ID } from "../../../../constants";
import { CreateTokenFormFields } from "../../../../hooks/useCreateToken";

export function CreateTokenButton() {
  const t = useTranslations("Token.submitButton");
  const { errors, isSubmitting } = useFormikContext<CreateTokenFormFields>();

  return (
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
  );
}
