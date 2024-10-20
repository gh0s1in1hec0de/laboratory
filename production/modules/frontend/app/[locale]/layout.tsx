import { Container } from "@/common/Container";
import { RootContainer } from "@/common/RootContainer";
import { Navbar } from "@/components/Navbar";
import { unstable_setRequestLocale } from "next-intl/server";
import { AppLayoutProps } from "./types";
import { GreetingModal } from "./components/GreetingModal";

export default async function AppLayout({
  children,
  params: { locale },
}: AppLayoutProps) {
  unstable_setRequestLocale(locale);

  return (
    <RootContainer>
      <Navbar />
      <Container as="main">
        {children}
      </Container>
      <GreetingModal />
    </RootContainer>
  );
}
