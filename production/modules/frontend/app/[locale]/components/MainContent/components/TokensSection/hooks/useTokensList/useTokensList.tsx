import { useState, ChangeEvent } from "react";

export function useTokensList() {
  const [search, setSearch] = useState<string>("");

  function handleSearch(event: ChangeEvent<HTMLInputElement>) {
    setSearch(event.target.value);
  }

  return {
    search,
    handleSearch,
  };
}
