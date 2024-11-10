import { Label } from "@/common/Label";
import { QuestionIcon } from "@/icons";
import { MainBox } from "@/common/MainBox";
import { InfoBlockProps } from "./types";
import styles from "./InfoBlock.module.scss";

export function InfoBlock({
  onClick,
  label,
  rounded,  
  ...otherProps
}: InfoBlockProps) {
  return (
    <MainBox 
      container
      alignItems="center"
      gap="2px"
      bgColor="gray"
      onClick={onClick}
      rounded={rounded}
      className={styles.infoBlock}
      {...otherProps}
    >
      <Label
        label={label}
        variantSize="regular14"
        offUserSelect
      />
      <QuestionIcon />
    </MainBox>
  );
}
