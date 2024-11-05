import { CustomCheckbox } from "@/common/CustomCheckbox";
import { CustomDrawer } from "@/common/CustomDrawer";
import { CustomRadioGroup } from "@/common/CustomRadioGroup";
import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { useTranslations } from "next-intl";
import { ManageButtons } from "./components/ManageButtons";
import { FILTER_DRAWER_SORT_BY_OPTIONS, FILTER_DRAWER_SORT_ORDER_OPTIONS } from "./constants";
import { FilterDrawerProps } from "./types";

export function FilterDrawer({
  isOpenDrawer,
  toggleOpenDrawer,
  succeed,
  handleSucceedChange,
  handleCreatedByChange,
  createdBy,
  orderBy,
  order,
  handleOrderByChange,
  handleOrderChange,
  handleResetFilter,
  handleApplyFilter,
  hasFilterDataChanged,
  onCloseDrawer,
}: FilterDrawerProps) {
  const t = useTranslations("Top.filterDrawer");

  return (
    <CustomDrawer
      isOpen={isOpenDrawer}
      onClose={onCloseDrawer}
      onOpen={toggleOpenDrawer}
      customCloseButton={(
        <ManageButtons
          handleResetFilter={handleResetFilter}
          handleApplyFilter={handleApplyFilter}
          hasFilterDataChanged={hasFilterDataChanged}
        />
      )}
    >
      <Grid container gap={2}>
        <Label label={t("title")} variantSize="bold18" />

        <Grid
          container
          size={12}
          flexDirection="column"
          gap={1}
        >
          <Label
            label={t("categories.title")}
            variantSize="bold16"
            variantColor="gray"
          />

          <CustomCheckbox
            checked={succeed === true}
            onChange={() => handleSucceedChange(true)}
            label={t("categories.succeed")}
          />
          <CustomCheckbox
            checked={succeed === false}
            onChange={() => handleSucceedChange(false)}
            label={t("categories.failed")}
          />

          <CustomCheckbox
            checked={!!createdBy}
            onChange={() => handleCreatedByChange(true)}
            label={t("categories.myLaunches")}
          />
        </Grid>

        <Grid
          container
          size={12}
          flexDirection="column"
          gap={1}
        >
          <Label
            label={t("sortBy.title")}
            variantSize="bold16"
            variantColor="gray"
          />

          <CustomRadioGroup
            options={FILTER_DRAWER_SORT_BY_OPTIONS}
            selected={orderBy}
            onChange={handleOrderByChange}
          />
        </Grid>

        <Grid
          container
          size={12}
          flexDirection="column"
          gap={1}
        >
          <Label
            label={t("sortOrder.title")}
            variantSize="bold16"
            variantColor="gray"
          />

          <CustomRadioGroup
            options={FILTER_DRAWER_SORT_ORDER_OPTIONS}
            selected={order}
            onChange={handleOrderChange}
          />
        </Grid>
      </Grid>
    </CustomDrawer>
  );
}
