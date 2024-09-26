import { Box } from "@mui/material";
import styles from "./Navbar.module.scss";
import { NavbarItems } from "./components/NavbarItems";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { NavbarItemType } from "./types";

export function Navbar() {
  const t = useTranslations("Navbar");

  const mapperIntl: Pick<NavbarItemType, "label" | "page">[] = [
    {
      label: t("first"),
      page: "",
    },
    {
      label: t("soon"),
      page: "token",
    },
    {
      label: t("soon"),
      page: "top"
    },
    {
      label: t("soon"),
      page: "rewards"
    },
    {
      label: t("soon"),
      page: "profile"
    },
  ];

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
          <NavbarItems itemLabels={mapperIntl}/>
        </Grid>
      </Box>
    </Grid>
  );
}
