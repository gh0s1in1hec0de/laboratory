import { Loader } from "@/common/Loader";
import { Box } from "@mui/material";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { StarBannerIcon } from "@/icons";
import { PollingProps } from "./types";
import { useTranslations } from "next-intl";

export function Polling({ isLaunchCreated }: PollingProps) {
  const t = useTranslations("Token.polling");

  return (
    <Grid
      container
      flexDirection="column"
      alignItems="center"
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
          label={t("paragraph1")}
          variantSize="regular16"
          textAlign="center"
          offUserSelect
        />

        <Box sx={{ textAlign: "center" }}>
          <Label
            label={t("paragraph2")}
            variantSize="regular16"
            textAlign="center"
            component="span"
            offUserSelect
          />
          <Label
            label={t("paragraph3")}
            variantSize="bold16"
            component="span"
            offUserSelect
            textAlign="center"
          />
          <Label
            label={t("paragraph4")}
            variantSize="regular16"
            component="span"
            offUserSelect
            textAlign="center"
          />
          <Label
            label={t("paragraph5")}
            variantSize="bold16"
            component="span"
            offUserSelect
            textAlign="center"
          />
        </Box>

        {isLaunchCreated && (
          <Label
            label={t("successfullyCreated")}
            variantSize="regular16"
            variantColor="green"
            textAlign="center"
          />
        )}
      </Grid>

      <Loader fullScreen={false} />
    </Grid>
  );
}
