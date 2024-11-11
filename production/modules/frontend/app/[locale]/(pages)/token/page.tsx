import Grid from "@mui/material/Grid2";
import { CreateTokenForm } from "./components/CreateTokenForm";
import { Label } from "@/common/Label";
import { StarBannerIcon } from "@/icons";
import { Box } from "@mui/material";
import { BgLight } from "@/common/BgLight";

export default function Token() {
  return (
    <Grid
      container
      width="100%"
    >
      {/* FORM */}
      {/* <CreateTokenForm /> */}

      {/* WAITING PAGE */}
      <Grid
        container
        flexDirection="column"
        alignItems="center"
        height="100%"
      >
        <StarBannerIcon />

        <Grid
          container
          flexDirection="column"
          gap={1.5}
          alignItems="center"
          justifyContent="center"
          paddingBottom={2}
        >
          <Label
            label="Now the smart contract that is responsible for your launch is being deployed to the network."
            variantSize="regular16"
            textAlign="center"
            offUserSelect
          />

          <Box sx={{ textAlign: "center" }}>
            <Label
              label="In the near future you will have the "
              variantSize="regular16"
              textAlign="center"
              component="span"
              offUserSelect
            />
            <Label
              label="opportunity to buy up to 25% "
              variantSize="bold16"
              component="span"
              offUserSelect
              textAlign="center"
            />
            <Label
              label="of your token supply "
              variantSize="regular16"
              component="span"
              offUserSelect
              textAlign="center"
            />
            <Label
              label="within 5 minutes."
              variantSize="bold16"
              component="span"
              offUserSelect
              textAlign="center"
            />
          </Box>
        </Grid>
      </Grid>

      {/* TOKEN PAGE */}
      {/* <Grid
        container
        flexDirection="column"
        // gap={1.5}
        width="100%"
      >
        <BgLight />
        123
      </Grid> */}
    </Grid>
  );
}
