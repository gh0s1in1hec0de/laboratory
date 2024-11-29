import Grid from "@mui/material/Grid2";
import { CustomAvatar } from "@/common/CustomAvatar";
import { Label } from "@/common/Label";
import { StarIcon } from "@/icons/common/StarIcon/StarIcon";
import { ExtendedUserBalance } from "starton-periphery";
import { fromNano } from "@ton/core";
import { useTranslations, useLocale } from "next-intl";
import { formatNumber, toCorrectAmount } from "@/utils";

export function LaunchInfo(balance: ExtendedUserBalance) {
  const t = useTranslations("Rewards");
  const totalTons = Number(fromNano(654324312312321)) + Number(fromNano(34213125423434132));
  console.log(totalTons);
  const locale = useLocale();

  return(
    <>
      <CustomAvatar
        size="extraSmall"
        src={balance.metadata.image}
        alt="Rewards Token Logo"
      />
      
      <Grid
        container
        size="grow"
        flexDirection="column"
      >
        <Grid
          container
          size="grow"
        >
          <Grid
            container
            flex={1}
            gap={0.5}
          >
            <Label
              label={`$${balance.metadata.symbol || "UNKNWN"}`}
              variantSize="medium16"
              offUserSelect />

            <Label
              label={balance.metadata.name || "Unknown"}
              variantSize="regular16"
              variantColor="gray"
              offUserSelect />
          </Grid>
        </Grid>

        <Grid
          container
          gap={0.5}
          size="grow"
          alignItems="center"
        >
          <Grid
            container
            alignItems="center"
            gap={0.5}
          >
            <Label
              label={t("myContribution")}
              variantSize="regular14"
              variantColor="gray"
              offUserSelect 
            />

            <StarIcon color="var(--white-regular)" />

            <Label
              // todo: заменить если цены отъебнут
              // label={`${formatNumber(totalTons)} ${t("ton")}`}
              label={`${toCorrectAmount({ amount: totalTons, fractionDigits: 3, locale: locale as "en" | "ru" })} ${t("ton")}`}
              variantSize="regular14"
              offUserSelect 
            />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
