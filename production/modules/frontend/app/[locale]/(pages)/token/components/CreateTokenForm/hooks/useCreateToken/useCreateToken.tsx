import { useState } from "react";

export function useCreateToken() {
  const [isLoading, setIsLoading] = useState(false);

  function onSubmitForm() {
    console.log("onSubmitForm");
  }

  return {
    isLoading,
    onSubmitForm,
  };
}
