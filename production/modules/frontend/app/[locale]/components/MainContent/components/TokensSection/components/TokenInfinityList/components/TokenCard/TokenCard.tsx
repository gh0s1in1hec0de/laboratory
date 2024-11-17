import { CustomAvatar } from "@/common/CustomAvatar";
import { Label } from "@/common/Label";
import { Stats } from "./components/Stats";
import Grid from "@mui/material/Grid2";
import styles from "./TokenCard.module.scss";
import { AdditionalInfo } from "./components/AdditionalInfo";
import { TokenCardProps } from "./types";
import { fromNano } from "@ton/core";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoadingWrapper } from "@/common/LoadingWrapper";
export function TokenCard({
  launch,
}: TokenCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleRedirectToLaunch() {
    startTransition(() => {
      router.push(`/${locale}/${launch.address}`);
    });
  }

  return (
    <LoadingWrapper isLoading={isPending}>
      <Grid
        container
        paddingY={1}
        alignItems="center"
        size="grow"
        gap={1}
        className={styles.card}
        onClick={handleRedirectToLaunch}
      >
        <CustomAvatar
          size="extraSmall"
          src={launch.metadata.image || "https://icdn.lenta.ru/images/2024/03/18/12/20240318124428151/square_1280_828947c85a8838d217fe9fcc8b0a17ec.jpg"}
          alt="Token Logo"
        />

        <Grid
          container
          size="grow"
          flexDirection="column"
          gap={0.5}
        >
          <Grid
            container
            size="grow"
          >
            <Grid
              container
              flex={1}
            >
              <Label
                label={`${launch.platformShare > 0.5 ? "🤩" : ""} $${launch.metadata.symbol || "UNKNWN"}`}
                variantSize="medium16"
                cropped
                offUserSelect
              />

              <Label
                label={launch.metadata.description || ""}
                variantSize="regular16"
                variantColor="gray"
                cropped
                offUserSelect
              />
            </Grid>
          </Grid>

          <AdditionalInfo 
            holders={launch.activeHolders || 0} 
            timings={launch.timings}
          />
        </Grid>

        <Stats
          collected={Number(fromNano(launch.totalTonsCollected || 0))}
          max={Number(fromNano(launch.minTonTreshold || 0))}
        />
      </Grid>
    </LoadingWrapper>
  );
}
