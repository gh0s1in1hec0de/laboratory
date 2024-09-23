import { LangSwitcher } from "@/common/LangSwitcher";
import { TonConnectProvider } from "@/common/TonConnectProvider";

export function LanguageSwitcherWithTon() {
  return (
    <TonConnectProvider>
      <LangSwitcher />
    </TonConnectProvider>
  );
}
