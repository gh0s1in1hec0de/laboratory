import Grid from "@mui/material/Grid2";
import { ContainerProps } from "./types";

export function Container({ children, as = "section" }: ContainerProps) {
  return (
    <Grid
      container
      size={{ xs: 10, sm: 6, md: 5, lg: 4, xl: 3 }}
      flexDirection="column"
      component={as}
      paddingX={2}
    >
      {children}
    </Grid>
  );
}
