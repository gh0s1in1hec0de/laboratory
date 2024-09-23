"use client";

import { usePathname, useRouter } from "next/navigation";
import { LOCALES } from "@/constants";
import { removeLocaleFromPath } from "@/utils";
import { Locales, useTonConnectUI } from "@tonconnect/ui-react";

export function LangSwitcher() {
  const [_, setOptions] = useTonConnectUI();
  const router = useRouter();
  const pathname = usePathname();


  function handleSwitchLanguage(newLocale: string) {
    const pathWithoutLocale = removeLocaleFromPath(pathname);
    router.push(`/${newLocale}/${pathWithoutLocale}`);
    setOptions({ language: newLocale as Locales });
  }

  return (
    <div>
      {LOCALES.map((locale) => (
        <button key={locale} onClick={() => handleSwitchLanguage(locale)}>
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
