import { Label } from "@/common/Label/Label";
import { MainBox } from "@/common/MainBox";
import { TicketsIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";

export function TicketBalance() {
  const t = useTranslations("Quests.header");
  
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
      <Grid container size="grow" alignItems="center" gap={1}>
        <TicketsIcon />
        <Label 
          label={`1/3 ${t("tickets")}`} 
          variantSize="semiBold32" 
        />
      </Grid>

      <Label 
        label={t("balance")} 
        variantSize="regular14" 
        variantColor="gray"
        offUserSelect
      />
    </MainBox>
  );
}
