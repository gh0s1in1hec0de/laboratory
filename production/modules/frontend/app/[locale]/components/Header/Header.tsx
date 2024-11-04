import { Label } from "@/common/Label";
import { CustomConnectButton } from "@/components/CustomConnectButton";
import { TonProvider } from "@/providers/ton";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { CreateTokenButton } from "./components/CreateTokenButton";

export function Header() {
  const t = useTranslations("Top");

  return (
    <Grid
      container
      justifyContent="space-between"
      alignItems="center"
      width="100%"
    >
      <Label
        variantSize="semiBold24"
        label={t("title")}
      />

      <TonProvider>
        <CustomConnectButton
          successChildren={<CreateTokenButton />}
          showDropdown={false}
        />
      </TonProvider>
    </Grid>
  );
}
