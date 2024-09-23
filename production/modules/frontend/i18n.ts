import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

export const locales = ["en", "ru"];
 
export default getRequestConfig(async ({ locale }) => {
  /**
   * Убедись, что входящий параметр «locale» действителен.
   */
  if (!locales.includes(locale as any)) notFound();

  return {
    // messages: (await import(`./locales/${locale}.json`)).default
    messages: (await import((`./locales/${locale}.json`))).default
  };
});
