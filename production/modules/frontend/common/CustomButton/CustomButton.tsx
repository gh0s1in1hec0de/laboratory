import { classNames } from "@/utils";
import { Button } from "@headlessui/react";
import { forwardRef } from "react";
import styles from "./CustomButton.module.scss";
import { useCustomButton } from "./hooks/useCustomButton/useCustomButton";
import { ButtonBackground, ButtonBorderColor, CustomButtonProps } from "./types";
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
    type = "button",
    form,
  }: CustomButtonProps,
  ref
  ) {
    const { isHovered, handleMouseEnter, handleMouseLeave } = useCustomButton();
    return (
      <Button
        as={as}
        type={type}
        {...(as === "button" && { form: form })}
        ref={ref}
        disabled={disabled}
        onClick={onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          padding: padding,
          borderRadius: borderRadius,
        }}
        className={classNames(
          styles.button,
          {
            [styles.hover]: isHovered && addHover && !disabled,
            [styles.fullWidth]: fullWidth,
            [styles.disabled]: disabled,
          },
          [styles[background], styles[borderColor], className],
        )}
      >
        {children}
      </Button>
    );
  });
