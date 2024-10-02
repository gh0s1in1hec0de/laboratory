import { Box } from "@mui/material";
import styles from "./Navbar.module.scss";
import { NavbarItems } from "./components/NavbarItems";
import Grid from "@mui/material/Grid2";

export function Navbar() {
  return (
    <Grid
      size={{ xs: 1 }}
      height={{ xs: 78 }}
      minHeight={78}
      position="static"
      zIndex="var(--z-index-navbar)"
    >
      <Box
        className={styles.navbar}
        component="aside"
        position="fixed"
        height="auto"
        width="100vw"
        left={0}
        bottom={0}
      >
        <Grid
          container
          component="nav"
          justifyContent={{ xs: "space-evenly", sm: "center" }}
          height="100%"
          gap={{ xs: 0, sm: "5vw" }}
          paddingTop={1}
          paddingBottom={2}
          flexDirection="row"
        >
          <NavbarItems />
        </Grid>
      </Box>
    </Grid>
  );
}
