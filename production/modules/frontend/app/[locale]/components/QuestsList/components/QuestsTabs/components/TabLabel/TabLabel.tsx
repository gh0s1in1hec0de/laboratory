import { CustomButton } from "@/common/CustomButton";
import Grid from "@mui/material/Grid2";
import { Label } from "@/common/Label";
import { Tab } from "@headlessui/react";
import { Fragment } from "react";
import { TabLabelProps } from "./types";

export function TabLabel({ label, setSelectedIndex }: TabLabelProps) {
  return (
    <Grid size="grow">
      <Tab as={Fragment}>
        {({ hover, selected }) => (
          <CustomButton 
            padding="8px"
            fullWidth 
            onClick={() => setSelectedIndex(0)} 
            background={selected ? "gray" : "transparent"}
            addHover={false}
          >
            <Label
              label={label}
              variantSize="medium16"
              variantColor={selected ? "white" : "gray"}
            />
          </CustomButton>
        )}
      </Tab>
    </Grid>
  );
}
