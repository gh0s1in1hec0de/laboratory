import Grid from "@mui/material/Grid2";
import { ContainerProps } from "./types";

export function Container({ 
  children, 
  as = "section",
  paddingX = 2,
  container = true,
  ...props
}: ContainerProps) {
  return (
    <Grid
      container={container}
      size={{ xs: 10, sm: 6, md: 5, lg: 4, xl: 3 }}
      flexDirection="column"
      component={as}
      paddingX={paddingX}
      {...props}
    >
      {children}
    </Grid>
  );
}
