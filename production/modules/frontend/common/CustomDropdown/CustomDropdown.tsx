import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { CustomDropdownProps } from "./types";
import { Fragment } from "react";
import { CustomButton } from "../CustomButton";
import { AnimatePresence, motion } from "framer-motion";
import { Label } from "../Label";
import styles from "./CustomDropdown.module.scss";
import { useTranslations } from "next-intl";
import { Box } from "@mui/material";
import { classNames } from "@/utils/classNames";

export function CustomDropdown({ 
  Button, 
  items,
  fullWidth = false,
}: CustomDropdownProps) {
  const t = useTranslations("");

  return (
    <Menu>
      {({ open }) => (
        <>
          <MenuButton className={classNames(styles.button, { [styles.fullWidth]: fullWidth })}>
            {Button}
          </MenuButton>

          <AnimatePresence>
            {open && (
              <MenuItems
                static
                as={motion.div}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                anchor="bottom"
                className={styles.items}
              >
                {items.map((item, index) => (
                  <Fragment key={index}>
                    <MenuItem as={Fragment}>
                      <CustomButton
                        background="transparent"
                        onClick={item.onClick}
                        padding="8px"
                        fullWidth={fullWidth}
                      >
                        <Label
                          label={t(item.label)}
                          variantSize="regular14" 
                          offUserSelect
                        />
                      </CustomButton>
                    </MenuItem>
                    {index !== items.length - 1 && (
                      <Box className={styles.divider} />
                    )}
                  </Fragment>
                ))}
              </MenuItems>
            )}
          </AnimatePresence>
        </>
      )}
    </Menu>
  );
}
