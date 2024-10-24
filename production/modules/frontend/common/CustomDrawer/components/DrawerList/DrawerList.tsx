import { Box } from "@mui/material";
import { StarIcon } from "@/icons";
import { DrawerListProps, DrawerListVariant } from "./types";
import { Label } from "@/common/Label";
import { useTranslations } from "next-intl";
import { Fragment } from "react";

export function DrawerList({
  data,
  variant = DrawerListVariant.STAR,
  paddingTop,
  paddingBottom,
  highlightColor = "orange",
  index,
}: DrawerListProps) {
  const t = useTranslations("");

  return (
    <Box 
      paddingTop={paddingTop} 
      paddingBottom={paddingBottom}
    >
      <Box
        display="flex"
        alignItems="baseline"
        gap={1}
      >
        {variant === DrawerListVariant.STAR ? (
          <Box>
            <StarIcon color="var(--orange-regular)" />
          </Box>
        ) : (
          <Box 
            sx={{
              background: "var(--orange-extra-dark)",
              borderRadius: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 10px",
            }}
          >
            {index && (
              <Label 
                label={index.toString()}
                variantColor="orange"
                variantSize="medium14"
              />
            )}
          </Box>
        )}

        <Box 
          // width="100%"
        >
          {data.map((item) => (
            <Fragment key={item.id} >
              <Label
                component="span"
                label={t(item.text)}
                variantColor={item.isHighlight ? highlightColor : undefined}
                isBold={item.isBold}
                isCursive={item.isCursive}
                variantSize={item.variantSize}
              />

              {item.description && (
                <Box 
                  display="flex"
                  flexDirection="column"
                  gap="2px"
                  paddingTop={1}
                >
                  {item.description.map((descriptionItem) => (
                    <Label
                      key={descriptionItem.id}
                      label={t(descriptionItem.text)}
                      variantColor={descriptionItem.isHighlight ? highlightColor : undefined}
                      isBold={descriptionItem.isBold}
                      isCursive={descriptionItem.isCursive}
                      variantSize={descriptionItem.variantSize}
                    />
                  ))}
                </Box>
              )}
            </Fragment>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
