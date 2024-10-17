import { Container } from "@/common/Container";
import { RootContainer } from "@/common/RootContainer";
import { Navbar } from "@/components/Navbar";
import { PAGES } from "@/constants";
import { getShowBanner } from "@/utils";
import { unstable_setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppLayoutProps } from "./types";

export default async function AppLayout({
  children,
  params: { locale },
}: AppLayoutProps) {
  unstable_setRequestLocale(locale);
  const showBanner = await getShowBanner();
  console.log(showBanner);

  if (showBanner) {
    return redirect(`${locale}/${PAGES.Banner}`);
  }

  return (
    <RootContainer>
      <Navbar />
      <Container as="main">
        {children}
      </Container>
    </RootContainer>
  );
}
