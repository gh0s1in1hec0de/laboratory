import { Button } from "@headlessui/react";
import styles from "./CustomButton.module.scss";
import { ButtonBackground, CustomButtonProps } from "./types";
import { classNames } from "@/utils";
import { Fragment } from "react";

export function CustomButton({ 
  disabled,
  onClick,
  children,
  fullWidth,
  background = ButtonBackground.Orange,
  as = "button",
  className,
  padding,
  borderRadius = 10,
  addHover = true,
}: CustomButtonProps) {

  return (
    <Button
      as={Fragment}
    >
      {({ hover, active }) => (
        <Button
          as={as}
          disabled={disabled}
          onClick={onClick}
          style={{ 
            padding: padding,
            borderRadius: borderRadius
          }}
          className={classNames(
            styles.button,
            {
              [styles.hover]: hover && addHover,
              [styles.fullWidth]: fullWidth,
            },
            [styles[background], className],
            // !hover && !active && "bg-sky-600",
            // hover && !active && "bg-sky-500",
            // active && "bg-sky-700"
          )}
        >
          {children}
        </Button>
      )}
    </Button>
  );
}
