import { LangSwitcher } from "@/components/LangSwitcher";
import { TonProvider } from "@/providers/ton";

export default function Profile() {
  return (
    <>
      <TonProvider>
        <LangSwitcher />
      </TonProvider>
    </>
  );
}
