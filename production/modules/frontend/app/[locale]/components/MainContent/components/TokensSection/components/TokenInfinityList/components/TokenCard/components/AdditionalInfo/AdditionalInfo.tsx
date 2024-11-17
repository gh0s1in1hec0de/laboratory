import { MainBox } from "@/common/MainBox";
import { Label } from "@/common/Label";
import { StarIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { AdditionalInfoProps } from "./types";
import { getCurrentSalePhase, SalePhase } from "starton-periphery";
import { useTranslations } from "next-intl";

export function AdditionalInfo({ holders, timings }: AdditionalInfoProps) {
  const t = useTranslations("CurrentLaunch");

  const { phase } = getCurrentSalePhase(timings);
  
  function renderPhase() {
    switch (phase) {
    case SalePhase.CREATOR:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="green"
          padding="4px 10px"
          rounded
        >
          <Label
            label="Creator"
            variantSize="regular14"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    case SalePhase.WHITELIST:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="gray"
          padding="4px 10px"
          rounded
        >
          <Label
            label="Star Club"
            variantSize="regular14"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    case SalePhase.PUBLIC:
      return (
        <MainBox
          container
          alignItems="center"
          gap="2px"
          bgColor="orange"
          padding="4px 10px"
          rounded
        >
          <Label
            label="Public"
            variantSize="regular14"
            variantColor="orange"
            cropped
          />
        </MainBox>
      );
    case SalePhase.ENDED:
      return (
        <MainBox
          container
          alignItems="center"
          bgColor="orange"
          padding="4px 10px"
          rounded
        >
          <Label
            label="Ended"
            variantSize="regular14"
            variantColor="red"
            offUserSelect
            cropped
          />
        </MainBox>
      );
    default:
      return null;
    }
  }

  return (
    <Grid
      container
      gap={0.5}
      size="grow"
      alignItems="center"
    >
      {renderPhase()}
      
      <Grid
        container
        alignItems="center"
        gap={0.5}
      >
        <StarIcon />

        <Label
          label={`${holders} ${t("holdersLabel")}`}
          variantSize="regular14"
          variantColor="gray"
          offUserSelect
        />
      </Grid>
    </Grid>
  );
}
