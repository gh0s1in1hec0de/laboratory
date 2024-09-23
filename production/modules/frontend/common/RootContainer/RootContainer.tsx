import { RootContainerProps } from "./types";
import Grid from "@mui/material/Grid2";

export function RootContainer({ children }: RootContainerProps) {
  return (
    <Grid
      columns={{ xs: 10 }}
      container
      flexDirection="column-reverse"
      height="auto"
      justifyContent="flex-end"
      alignItems="center"
    >
      {children}
    </Grid>
  );
}
