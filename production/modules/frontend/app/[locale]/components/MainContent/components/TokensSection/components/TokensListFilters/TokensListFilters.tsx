import Grid from "@mui/material/Grid2";
import { CustomInput } from "@/common/CustomInput";
import { useTranslations } from "next-intl";
import { TokensListFiltersProps } from "./types";

export function TokensListFilters({
  search,
  handleSearch,
}: TokensListFiltersProps) {
  const t = useTranslations("Top");

  return (
    <Grid container width="100%">
      <CustomInput 
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={handleSearch}
        startAdornment="loupe"
      />
    </Grid>
  );
}
