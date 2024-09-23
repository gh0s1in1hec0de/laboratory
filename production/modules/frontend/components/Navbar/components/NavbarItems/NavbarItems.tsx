"use client";

import { Box, IconButton } from "@mui/material";
import { Label } from "@/common/Label";
import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { removeLocaleFromPath } from "@/utils";
import { NavbarItemsProps } from "./types";
import { NAVBAR_ITEMS } from "./constants";
import { NavbarItemType } from "../../types";

export function NavbarItems({ itemLabels }: NavbarItemsProps) {
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  function handleClick(page: Pick<NavbarItemType, "page">) {
    // todo: delete when launchpad is done
    if (page.page === "quests"){
      router.push(`/${locale}/${page.page}`);
    }
  }

  function isActive(page: Pick<NavbarItemType, "page">) {
    return removeLocaleFromPath(pathname) === page.page;
  }

  function getItemLabel(page: Pick<NavbarItemType, "page">) {
    const item = itemLabels.find(item => item.page === page.page);
    return item ? item.label : "";
  }
  
  return(
    <>
      {NAVBAR_ITEMS.map(({ page, IconComponent, id }) => (
        <Box
          key={id}
          minWidth={50}
          display="flex"
          alignItems="center"
          flexDirection="column"
          onClick={() => handleClick({ page })}
          // todo: delete when launchpad is done
          sx={{ cursor: `${page === "" ? "pointer" : "default"}`, opacity: `${page === "" ? 1 : 0.5}` }}
          // sx={{ cursor: "pointer" }}
        >
          <IconButton style={{ padding: 0, cursor: "inherit" }}>
            <IconComponent active={isActive({ page })}/>
          </IconButton>
          <Label
            label={getItemLabel({ page })}
            variantColor={isActive({ page }) ? "orange" : "gray"}
            variantSize="medium10"
            offUserSelect
          />
        </Box>
      ))}
    </>
  );
}
