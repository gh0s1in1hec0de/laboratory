import { Label } from "@/common/Label";
import { LoadingWrapper } from "@/common/LoadingWrapper";
import { ConnectButtonSkeleton } from "@/components/CustomConnectButton";
import Grid from "@mui/material/Grid2";
import { useLaunchActions } from "./hooks/useLaunchActions";
import { ButtonsProps } from "./types";

export function Buttons({
  launchData,
}: ButtonsProps) {
  const {
    isLoading,
    errorText,
    renderContent,
  } = useLaunchActions(launchData);

  return (
    <LoadingWrapper
      isLoading={isLoading}
      skeleton={<ConnectButtonSkeleton fullWidth />}
    >
      {errorText && (
        <Label
          label={errorText}
          variantSize="regular14"
          variantColor="red"
        />
      )}

      <Grid
        container
        width="100%"
      >
        {renderContent()}
      </Grid>
    </LoadingWrapper>
  );
}
