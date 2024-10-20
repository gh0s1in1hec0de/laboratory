import { Button } from "@headlessui/react";
import styles from "./CustomButton.module.scss";
import { ButtonBackground, ButtonBorderColor, CustomButtonProps } from "./types";
import { classNames } from "@/utils";
import { forwardRef, Fragment } from "react";

export const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  function CustomButton({ 
    disabled,
    onClick,
    children,
    fullWidth = false,
    background = ButtonBackground.Orange,
    as = "button",
    className,
    padding,
    borderRadius = 10,
    borderColor = ButtonBorderColor.BorderTransparent,
    addHover = true,
  }: CustomButtonProps, 
  ref
  ) {

    return (
      <Button
        as={Fragment}
      >
        {({ hover, active }) => (
          <Button
            as={as}
            ref={ref}
            disabled={disabled}
            onClick={onClick}
            style={{ 
              padding: padding,
              borderRadius: borderRadius,
            }}
            className={classNames(
              styles.button,
              {
                [styles.hover]: hover && addHover,
                [styles.fullWidth]: fullWidth,
                [styles.disabled]: disabled,
              },
              [styles[background], styles[borderColor], className],
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
  });
