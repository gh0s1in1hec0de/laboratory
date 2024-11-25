import { 
  getCurrentSalePhase, 
  SalePhase, 
  TokenLaunchTimings 
} from "starton-periphery";
import { MainBox } from "@/common/MainBox";
import { Label } from "@/common/Label";

export function useAdditionalInfo(
  timings: TokenLaunchTimings,
  isSuccessful: boolean | null,
) {
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
          rounded="xs"
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
          rounded="xs"
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
          rounded="xs"
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
      if (isSuccessful) {
        return (
          <MainBox
            container
            alignItems="center"
            bgColor="green"
            padding="4px 10px"
            rounded="xs"
          >
            <Label
              label="Successful"
              variantSize="regular14"
              variantColor="green"
              offUserSelect
              cropped
            />
          </MainBox>
        );
      } 
      if (!isSuccessful) {
        return (
          <MainBox
            container
            alignItems="center"
            bgColor="orange"
            padding="4px 10px"
            rounded="xs"
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
      }
    }
  }

  return { renderPhase };
}
