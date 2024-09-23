export function removeLocaleFromPath(urlWithLocale: string) {
  return urlWithLocale.replace(/^\/[a-zA-Z]{2}(\/|$)/, "").replace(/^\/$/, "");
}
