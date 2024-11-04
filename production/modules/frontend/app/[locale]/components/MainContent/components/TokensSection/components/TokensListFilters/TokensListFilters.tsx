import { CustomInput } from "@/common/CustomInput";
import { LoupeIcon } from "@/icons";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { FilterAdornment } from "./components/FilterAdornment";
import { TokensListFiltersProps } from "./types";

export function TokensListFilters({
  search,
  handleSearch,
  toggleOpenDrawer,
}: TokensListFiltersProps) {
  const t = useTranslations("Top");

  return (
    <Grid container width="100%">
      <CustomInput 
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={handleSearch}
        startAdornment={<LoupeIcon />}
        endAdornment={<FilterAdornment toggleOpenDrawer={toggleOpenDrawer} />}
      />
    </Grid>
  );
}
