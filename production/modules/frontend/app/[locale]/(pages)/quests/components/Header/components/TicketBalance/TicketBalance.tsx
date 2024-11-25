import { Label } from "@/common/Label/Label";
import { MainBox } from "@/common/MainBox";
import { TicketsIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { Balance } from "./components/Balance";
import { RedirectButton } from "./components/RedirectButton";
import { TicketBalanceProps } from "./types";

export function TicketBalance({
  description,
  rounded,
  showRedirectButton = false,
  padding = "16px 12px"
}: TicketBalanceProps) {
  const t = useTranslations("Tasks.header");

  return (
    <MainBox
      container
      gap="2px"
      padding={padding}
      flexDirection="column"
      fullWidth
      rounded={rounded}
      bgColor="transparent"
    >
      <Grid
        container
        size="grow"
        alignItems="center"
        gap={1}
      >
        <Grid container gap={1} size="grow" flexDirection="column">
          <Grid container gap={1} alignItems="center">
            <TicketsIcon />
            <Balance />
          </Grid>

          <Label
            label={description || t("balance")}
            variantSize="regular14"
            variantColor="gray"
            offUserSelect
          />
        </Grid>

        {showRedirectButton && (
          <RedirectButton />
        )}
      </Grid>
    </MainBox>
  );
}
