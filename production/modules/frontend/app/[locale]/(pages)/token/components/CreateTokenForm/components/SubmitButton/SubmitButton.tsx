import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useFormikContext } from "formik";
import { CreateTokenFormFields } from "../../hooks/useCreateToken";
import { CREATE_TOKEN_FORM_ID } from "../../constants";

export function SubmitButton() {
  const { errors, isSubmitting } = useFormikContext<CreateTokenFormFields>();

  return (
    <CustomButton
      form={CREATE_TOKEN_FORM_ID}
      type="submit"
      padding="10px 6px"
      disabled={Object.keys(errors).length > 0 || isSubmitting}
      fullWidth
    >
      <Label
        label="Create"
        variantSize="medium16"
        offUserSelect
        // label={isSubmitting ? t("saveLoading") : t("save")}
      />
    </CustomButton>
  );
}
