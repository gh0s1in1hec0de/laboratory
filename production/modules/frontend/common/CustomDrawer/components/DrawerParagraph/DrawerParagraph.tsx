import { useTranslations } from "next-intl";
import { DrawerTextProps } from "./types";
import { Label } from "@/common/Label";
import { Box } from "@mui/material";
import { MainBox } from "@/common/MainBox";

export function DrawerParagraph({
  data,
  highlightColor = "orange",
  inBox = false,
  paddingTop,
  paddingBottom,
}: DrawerTextProps) {
  const t = useTranslations("");

  return (
    <Box 
      paddingTop={paddingTop} 
      paddingBottom={paddingBottom}
    >
      {inBox ? (
        <MainBox 
          container
          padding="4px 12px"
          gap="2px"
          bgColor="orange" 
          rounded
          width="fit-content"
        >
          {data.map((item) => (
            <Label
              key={item.id}
              component="span"
              label={t(item.text)}
              variantColor={item.isHighlight ? highlightColor : undefined}
              isBold={item.isBold}
              isCursive={item.isCursive}
              variantSize={item.variantSize}
            />
          ))}
        </MainBox>
      ) : (
        <Box>
          {data.map((item) => (
            <Label
              key={item.id}
              component="span"
              label={t(item.text)}
              variantColor={item.isHighlight ? highlightColor : undefined}
              isBold={item.isBold}
              isCursive={item.isCursive}
              variantSize={item.variantSize}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
