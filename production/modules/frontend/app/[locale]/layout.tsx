import { RootContainer } from "@/common/RootContainer";
import { AppLayoutProps } from "./layout.types";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/common/Container";

export default async function AppLayout({
  children,
}: AppLayoutProps) {

  return (
    <RootContainer>
      <Navbar/>
      <Container
        as="main"
        size={{ xs: 1, sm: 0.75 }}
      >
        {children}
      </Container>
    </RootContainer>
  );
}
