import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { FormikCustomInput } from "@/components/FormikCustomInput";
import styles from "./SocialMediaInfo.module.scss";
import { SOCIAL_MEDIA_DATA } from "./constants";
import { useTranslations } from "next-intl";
import { useFormikContext } from "formik";
import { CreateTokenFormFields } from "../../hooks/useCreateToken";

export function SocialMediaInfo() {
  const t = useTranslations("Token.urlInput");
  const { isSubmitting } = useFormikContext<CreateTokenFormFields>();

  return (
    <Grid
      container
      width="100%"
      gap={1.5}
    >
      <Grid container gap={0.5}>
        <Label 
          label={t("label")}
          variantSize="semiBold18"
          offUserSelect
        />
        
        <Label 
          label={t("description")}
          variantSize="regular16"
          variantColor="gray"
          offUserSelect
        />
      </Grid>

      {SOCIAL_MEDIA_DATA.map((item) => (
        <FormikCustomInput
          fullWidth
          key={item.formikName}
          name={item.formikName}
          placeholder={t(item.placeholder)}
          disabled={isSubmitting}
          endAdornment={(
            <Label
              label={t(item.label)}
              variantSize="regular14"
              variantColor="grayDark"
              className={styles.endAdornment}
              offUserSelect
            />
          )}
        />
      ))}
    </Grid>
  );
}
