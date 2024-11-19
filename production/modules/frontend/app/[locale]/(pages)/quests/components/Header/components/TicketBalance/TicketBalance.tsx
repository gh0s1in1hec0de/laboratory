import { Label } from "@/common/Label/Label";
import { MainBox } from "@/common/MainBox";
import { TicketsIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { Balance } from "./components/Balance";

export function TicketBalance({ description }: { description?: string }) {
  const t = useTranslations("Tasks.header");
  
  return (
    <MainBox 
      container
      gap="2px"
      padding="16px 12px"
      flexDirection="column"
      fullWidth
      rounded
      bgColor="transparent" 
    >
      <Grid 
        container 
        size="grow"
        alignItems="center"
        gap={1}
      >
        <TicketsIcon />
        <Balance />
      </Grid>

      <Label 
        label={description || t("balance")} 
        variantSize="regular14" 
        variantColor="gray"
        offUserSelect
      />
    </MainBox>
  );
}
