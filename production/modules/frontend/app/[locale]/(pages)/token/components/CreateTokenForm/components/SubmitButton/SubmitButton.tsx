import { Label } from "@/common/Label";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { TonProvider } from "@/providers/ton";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { CreateTokenButton } from "./components/CreateTokenButton";

export function SubmitButton() {
  const t = useTranslations("Token.submitButton");

  return (
    <Grid
      container
      width="100%"
      gap={1}
    >
      <TonProvider>
        <CustomConnectButton
          successChildren={<CreateTokenButton />}
          fullWidth
          showDropdown={false}
        />
      </TonProvider>

      <Label
        label={t("description")}
        variantSize="regular14"
        variantColor="gray"
        offUserSelect
      />
    </Grid>
  );
}
