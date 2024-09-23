import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { CustomDropdownProps } from "./types";
import { Fragment } from "react";
import { classNames } from "@/utils/classNames";

export function CustomDropdown({ children }: CustomDropdownProps) {
  return (
    <Menu>
      <MenuButton as={Fragment}>
        {({ hover, active }) => (
          <button className={classNames("")}>My account</button>
        )}
      </MenuButton>
      <MenuButton>My account</MenuButton>
      <MenuItems anchor="bottom" transition>
        <MenuItem>
          <a className="block data-[focus]:bg-blue-100" href="/settings">
               Settings
          </a>
        </MenuItem>
        <MenuItem>
          <a className="block data-[focus]:bg-blue-100" href="/support">
               Support
          </a>
        </MenuItem>
        <MenuItem>
          <a className="block data-[focus]:bg-blue-100" href="/license">
               License
          </a>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
