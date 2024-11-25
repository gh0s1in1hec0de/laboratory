import { DrawerParagraph } from "@/common/CustomDrawer";
import { Label } from "@/common/Label";
import { ArrowIcon } from "@/icons";
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import Grid from "@mui/material/Grid2";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import {
  DRAWER_FIRST_TEXT_DATA,
  DRAWER_FOURTH_TEXT_DATA,
  DRAWER_SECOND_TEXT_DATA,
  DRAWER_THIRD_TEXT_DATA,
} from "./constants";
import styles from "./RefundsDescription.module.scss";

export function RefundsDescription() {
  const t = useTranslations("Token.descriptions.refunds");

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
                    <DrawerParagraph data={DRAWER_FIRST_TEXT_DATA} />
                    <DrawerParagraph data={DRAWER_SECOND_TEXT_DATA} />
                    <DrawerParagraph
                      data={DRAWER_THIRD_TEXT_DATA}
                      inBox
                      paddingTop={1}
                    />
                    <DrawerParagraph data={DRAWER_FOURTH_TEXT_DATA} />
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
