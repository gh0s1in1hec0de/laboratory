import { useEffect, useState } from "react";
import { userService } from "@/services";

export function useTicketBalance() {
  const [balance, setBalance] = useState<number>();
  const [error, setError] = useState<string>("");

  useEffect(() => {
    (async () => {
      setError("");
      try {
        const balance = await userService.getTicketBalance();
        setBalance(balance);
      } catch (error) {
        setError("error");
      }
    })();
  }, []);

  return { 
    balance,
    error
  };
}
