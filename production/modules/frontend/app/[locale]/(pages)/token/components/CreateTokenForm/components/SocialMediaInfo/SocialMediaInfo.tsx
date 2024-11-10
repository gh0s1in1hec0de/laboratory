import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { FormikCustomInput } from "@/components/FormikCustomInput";
import styles from "./SocialMediaInfo.module.scss";
import { SOCIAL_MEDIA_DATA } from "./constants";

export function SocialMediaInfo() {
  return (
    <Grid
      container
      width="100%"
      gap={1.5}
    >
      <Grid container gap={0.5}>
        <Label 
          label="Social media"
          variantSize="semiBold18"
          offUserSelect
        />
        
        <Label 
          label="You can provide social media links to improve your token conversion"
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
          placeholder={item.placeholder}
          endAdornment={(
            <Label
              label={item.label}
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
