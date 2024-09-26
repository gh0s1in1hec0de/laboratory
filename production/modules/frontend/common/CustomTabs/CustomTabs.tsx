import { TabGroup, TabList, TabPanels } from "@headlessui/react";
import Grid from "@mui/material/Grid2";
import { TabLabel } from "./components/TabLabel";
import styles from "./CustomTabs.module.scss";
import { CustomTabsProps } from "./types";
import { useState } from "react";

export function CustomTabs({
  tabLabels,
  children,
}: CustomTabsProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  function handleSetCurrentValue(index: number) {
    setSelectedIndex(index);
  }

  return (
    <TabGroup
      selectedIndex={selectedIndex}
      onChange={handleSetCurrentValue}
      className={styles.tabs}
    >
      <TabList className={styles.bg}>
        <Grid container gap={1}>
          {tabLabels.map((tab, index) => (
            <TabLabel
              key={index}
              label={tab}
            />
          ))}
        </Grid>
      </TabList>

      <TabPanels>
        {children}
      </TabPanels>
    </TabGroup>
  );
}
