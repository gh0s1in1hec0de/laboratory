import { MainBox } from "@/common/MainBox";
import { Label } from "@/common/Label";
import { TimerCardProps } from "./types";

export function TimerCard({
  label,
  value,
}: TimerCardProps) {
  return (
    <MainBox
      flexDirection="column"
      alignItems="center"
      paddingY={1}
      paddingX={0.5}
      rounded="xs"
      minWidth="70px"
    >
      <Label
        label={value}
        variantSize="medium44"
      />
      <Label
        label={label}
        variantColor="gray"
        variantSize="regular14"
      />
    </MainBox>
  );
}
