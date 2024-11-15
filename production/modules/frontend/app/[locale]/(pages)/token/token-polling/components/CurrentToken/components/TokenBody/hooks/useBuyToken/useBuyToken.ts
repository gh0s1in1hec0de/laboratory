import { useState } from "react";

export function useBuyToken() {
  const [value, setValue] = useState<string>("");

  async function onClickBuyTokens() {
    console.log("onClickBuyTokens");
  }

  return {
    value,
    setValue,
    onClickBuyTokens,
  };
}
