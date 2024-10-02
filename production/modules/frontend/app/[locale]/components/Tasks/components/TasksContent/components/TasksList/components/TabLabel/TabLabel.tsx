"use client";
import { CustomButton } from "@/common/CustomButton";
import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { TabLabelProps } from "./types";
import { useTranslations } from "next-intl";

export function TabLabel({ label }: TabLabelProps) {
  const t = useTranslations("");

  return (
    <Grid size="grow">
      {/* <Tab as={Fragment}>
        {({ hover, selected }) => ( */}
      <div style={{ outline: "none" }}>
        <CustomButton 
          padding="8px"
          fullWidth 
          onClick={() => {}} 
          background="transparent"
          addHover={false}
        >
          <Label
            label={t(label)}
            variantSize="medium16"
            variantColor="gray"
          />
        </CustomButton>
      </div>
      {/* )}
      </Tab> */}
    </Grid>
  );
}
