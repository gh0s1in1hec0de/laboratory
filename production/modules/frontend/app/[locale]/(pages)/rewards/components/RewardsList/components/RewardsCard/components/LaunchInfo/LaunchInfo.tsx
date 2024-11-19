import Grid from "@mui/material/Grid2";
import { CustomAvatar } from "@/common/CustomAvatar";
import { Label } from "@/common/Label";
import { StarIcon } from "@/icons/common/StarIcon/StarIcon";
import { ExtendedUserBalance } from "starton-periphery";
import { fromNano } from "@ton/core";
import { useTranslations } from "next-intl";

export function LaunchInfo(balance: ExtendedUserBalance) {
  const t = useTranslations("Rewards");

  return(
    <>
      <CustomAvatar
        size="extraSmall"
        src={balance.metadata.image ?? "https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"}
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
              label={`${fromNano(balance.whitelistTons) + fromNano(balance.publicTons)} ${t("ton")}`}
              variantSize="regular14"
              offUserSelect 
            />
          </Grid>
        </Grid>
      </Grid>
    </>
  );
}
