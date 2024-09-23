import { ReactNode, ElementType } from "react";

export enum ButtonBackground {
	Orange = "orange",
	Red = "red",
	Gray = "gray",
	Transparent = "transparent",
}

export interface CustomButtonProps {
	children: ReactNode;
  onClick: () => void;
	className?: string;
	as?: ElementType;
	disabled?: boolean;
	fullWidth?: boolean;
	background?: `${ButtonBackground}`;
	padding?: string | number;
	addHover?: boolean;
}
