import { ReactNode, ElementType } from "react";

export enum ButtonBackground {
	Orange = "orange",
	Red = "red",
	Gray = "gray",
	Transparent = "transparent",
  TransparentOutline = "transparentOutline",
}

export enum ButtonBorderColor {
	BorderOrange = "borderOrange",
	BorderGray = "borderGray",
  BorderTransparent = "borderTransparent",
}

export interface CustomButtonProps {
	children: ReactNode;
  onClick?: () => void;
	className?: string;
	as?: ElementType;
	disabled?: boolean;
	fullWidth?: boolean;
	background?: `${ButtonBackground}`;
	padding?: string | number;
	addHover?: boolean;
	borderRadius?: number;
	borderColor?: `${ButtonBorderColor}`;
	type?: "button" | "submit" | "reset";
	form?: string;
}
