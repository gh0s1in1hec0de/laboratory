import { MarketingSupportTabsValues } from "../../../../hooks/useCreateToken";
import { useField } from "formik";
import { useToggle } from "@/hooks";
export function useMarketingSupportInfo() {
  const [{ value: marketingSupportEnabled }, {}, {}] = useField("marketingSupportEnabled");
  const [{ value: marketingSupportValue }, {}, { setValue: setMarketingSupportValue }] = useField("marketingSupportValue");
  const [{}, {}, { setValue: setInfluencerSupportValue }] = useField("influencerSupport");
  const [isOpenDrawer, toggleOpenDrawer] = useToggle(false);

  function handleMarketingSupportTabsChange(tab: MarketingSupportTabsValues) {
    if (tab === MarketingSupportTabsValues.LOW && marketingSupportEnabled) {
      setInfluencerSupportValue(false);
    }
    
    setMarketingSupportValue(tab);
  }

  function handleMarketingSupportEnabledChange(currentMarketingSupportEnabled: boolean) {
    if (!currentMarketingSupportEnabled) {
      setInfluencerSupportValue(false);
    }
  }

  return {
    marketingSupportValue,
    marketingSupportEnabled,
    handleMarketingSupportTabsChange,
    handleMarketingSupportEnabledChange,
    isOpenDrawer,
    toggleOpenDrawer,
  };
}
