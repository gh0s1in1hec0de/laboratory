"use client";

import { Box, Portal, SwipeableDrawer } from "@mui/material";
import styles from "./CustomDrawer.module.scss";
import { CustomDrawerProps } from "./types";
import { Container } from "../Container";
import Grid from "@mui/material/Grid2";
import { CustomButton } from "../CustomButton";
import { Label } from "../Label";

export function CustomDrawer({
  isOpen,
  onClose,
  onOpen,
  children,
  anchor = "bottom",
  autoFocus = true,
  closeButtonLabel,
  customCloseButton,
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
        <Grid 
          container 
          columns={{ xs: 10 }} 
          justifyContent="center" 
          width="100%"
        >
          <Container>
            <Grid
              container
              paddingY="12px"
              width="100%"
              justifyContent="center"
            >
              <Box className={styles.button} />
            </Grid>

            <Grid 
              container 
              width="100%"
              paddingBottom="20px"
            >
              {children}
            </Grid>

            {closeButtonLabel ? (
              <CustomButton 
                onClick={onClose}
                padding="10px 0"
                fullWidth
              >
                <Label 
                  label={closeButtonLabel} 
                  variantSize="regular14" 
                  offUserSelect
                />
              </CustomButton>
            ) : customCloseButton}
          </Container>
        </Grid>
      </SwipeableDrawer>
    </Portal>
  );
}
