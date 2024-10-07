import { RootContainer } from "@/common/RootContainer";
import { Navbar } from "@/components/Navbar";
import { Container } from "@/common/Container";
import { PropsWithChildren } from "react";

export default async function AppLayout({
  children,
}: PropsWithChildren) {

  return (
    <RootContainer>
      <Navbar/>
      <Container as="main">
        {children}
      </Container>
    </RootContainer>
  );
}
