import { BgLight } from "@/common/BgLight";
import Grid from "@mui/material/Grid2";
import { CustomAvatar } from "@/common/CustomAvatar";

export function UploadImage() {
  return (
    <Grid container height="200px" width="100%">
      <CustomAvatar
        size="large"
        src={"https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"}
        alt="Token Logo"
      />
    </Grid>
  );
}
