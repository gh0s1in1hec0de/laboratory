import { CustomButton } from "@/common/CustomButton";
import { Label } from "@/common/Label";
import { useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { CREATE_TOKEN_FORM_ID } from "../../../../constants";
import { CreateTokenFormFields } from "../../../../hooks/useCreateToken";
import { Caller } from "starton-periphery";

export function CreateTokenButton({ callerData }: { callerData: Caller | null }) {
  const t = useTranslations("Token.submitButton");
  const { errors, isSubmitting } = useFormikContext<CreateTokenFormFields>();

  const isDisabled =
    isSubmitting || 
    (process.env.NEXT_PUBLIC_CREATOR_MODE === "private" && (!callerData || callerData.isBigBoss === false));

  const labelText = isSubmitting
    ? t("loading")
    : isDisabled
      ? t("disableText")
      : t("label");

  return (
    <CustomButton
      form={CREATE_TOKEN_FORM_ID}
      type="submit"
      padding="10px 6px"
      // disabled={Object.keys(errors).length > 0 || isSubmitting}
      disabled={isDisabled}
      fullWidth
    >
      <Label
        label={labelText}
        variantSize="medium16"
        offUserSelect
      />
    </CustomButton>
  );
}
