import { ChangeEvent } from "react";

export interface TokensListFiltersProps {
  search: string;
  handleSearch: (event: ChangeEvent<HTMLInputElement>) => void;
  toggleOpenDrawer: () => void;
}
