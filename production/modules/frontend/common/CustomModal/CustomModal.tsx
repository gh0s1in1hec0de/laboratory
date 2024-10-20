"use client";

import { Container } from "@/common/Container";
import { classNames } from "@/utils";
import { Dialog } from "@mui/material";
import Grid from "@mui/material/Grid2";
import styles from "./CustomModal.module.scss";
import { CustomModalProps } from "./types";

export function CustomModal({
  isOpen,
  onClose,
  fullScreen = false,
  children,
  autoClose = true,
  padding = 2,
}: CustomModalProps) {
  return (
    <Dialog
      fullScreen={fullScreen}
      open={isOpen}
      onClose={autoClose ? onClose : undefined}
      classes={{
        root: classNames(styles.root, { [styles.fullScreen]: fullScreen }),
        paper: styles.paper
      }}
    >
      <Grid
        container
        columns={{ xs: 10 }}
        justifyContent="center"
        width="100%"
        height="100%"
      >
        <Container
          container={false}
          padding={padding}
        >
          {children}
        </Container>
      </Grid>
    </Dialog>
  );
}
