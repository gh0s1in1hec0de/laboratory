"use client";

import { Box, Portal, SwipeableDrawer } from "@mui/material";
import styles from "./CustomDrawer.module.scss";
import { CustomDrawerProps } from "./types";
import { Container } from "../Container";
import Grid from "@mui/material/Grid2";
export function CustomDrawer({
  isOpen,
  onClose,
  onOpen,
  children,
  anchor = "bottom",
  autoFocus = true,
}: CustomDrawerProps) {

  return (
    <Portal>
      <SwipeableDrawer
        anchor={anchor}
        open={isOpen}
        onClose={onClose}
        onOpen={onOpen}
        autoFocus={autoFocus}
        classes={{
          root: styles.root,
          paper: styles.paper,
        }}
      >
        <Container paddingX={0}>
          <Grid
            container
            paddingY="12px"
            width="100%"
            justifyContent="center"
          >
            <Box className={styles.button} />
          </Grid>

          <Grid container width="100%">
            {children}
          </Grid>
        </Container>
      </SwipeableDrawer>
    </Portal>
  );
}
