import { Label } from "@/common/Label";
import Grid from "@mui/material/Grid2";
import { 
  DRAWER_FIRST_LIST_DATA, 
  DRAWER_THIRD_LIST_DATA, 
  DRAWER_SECOND_LIST_DATA, 
  DRAWER_THIRD_TEXT_DATA, 
  DRAWER_FOURTH_LIST_DATA, 
  DRAWER_FIFTH_LIST_DATA, 
  DRAWER_SIXTH_LIST_DATA, 
  DRAWER_SEVENTH_LIST_DATA, 
  DRAWER_SECOND_TEXT_DATA 
} from "@/app/[locale]/components/MainContent/components/WaveLaunchDrawer/constants";
import { DrawerList, DrawerParagraph } from "@/common/CustomDrawer";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { motion } from "framer-motion";
import { ArrowIcon } from "@/icons";
import styles from "./WaveLaunchDescription.module.scss";
import { useTranslations } from "next-intl";

export function WaveLaunchDescription() {
  const t = useTranslations("Token.descriptions.waveLaunch");

  return (
    <>
      <Disclosure>
        {({ open }) => (
          <Grid
            container
            alignItems="center"
            size={12}
            width="100%"
            gap={open ? 1 : 0}
          >
            <DisclosureButton
              as="div"
              className={styles.button}
            >
              <Label
                label={t("title")}
                variantSize="regular16"
                offUserSelect 
              />

              <ArrowIcon isRotate={open} />
            </DisclosureButton>

            <DisclosurePanel static style={{ width: "100%" }}>
              {({ open }) => (
                <motion.div
                  initial={false}
                  animate={{
                    height: open ? "auto" : 0,
                    opacity: open ? 1 : 0,
                  }}
                  style={{
                    overflow: "hidden",
                  }}
                  transition={{
                    height: { duration: 0.3, ease: [0.42, 0, 0.58, 1] },
                    opacity: { duration: 0.1, ease: "easeInOut" },
                    layout: { duration: 0.1, ease: "easeInOut" },
                  }}
                >
                  <Grid
                    container
                    gap={1}
                    flexDirection="column"
                  >
                    <DrawerParagraph data={DRAWER_SECOND_TEXT_DATA} />
                    <DrawerList
                      paddingTop={2}
                      data={DRAWER_FIRST_LIST_DATA}
                      variant="circle"
                      index={1} />
                    <DrawerList
                      paddingTop={1}
                      data={DRAWER_SECOND_LIST_DATA}
                      variant="circle"
                      index={2} />
                    <DrawerList
                      paddingTop={1}
                      data={DRAWER_THIRD_LIST_DATA}
                      variant="circle"
                      index={3} />
                    <DrawerParagraph
                      data={DRAWER_THIRD_TEXT_DATA}
                      paddingTop={2} />
                    <DrawerList data={DRAWER_FOURTH_LIST_DATA} />
                    <DrawerList data={DRAWER_FIFTH_LIST_DATA} />
                    <DrawerList data={DRAWER_SIXTH_LIST_DATA} />
                    <DrawerList data={DRAWER_SEVENTH_LIST_DATA} />
                  </Grid>
                </motion.div>
              )}
            </DisclosurePanel>
          </Grid>
        )}
      </Disclosure>
      
      <Grid container size={12} paddingTop={0.5}>
        <div style={{ width: "100%", height: "1px", backgroundColor: "var(--black-regular)" }} />
      </Grid>
    </>
  );
}
