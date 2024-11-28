import { Label } from "@/common/Label";
import { ReactNode } from "react";

export function useSubTasks(disabled: boolean) {
  function renderTextWithLinks(text: string): (string | ReactNode)[] {
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts: (string | ReactNode)[] = [];
    let lastIndex = 0;
    let match;
  
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <Label
            component="span"
            variantSize="regular14"
            variantColor="gray"
            offUserSelect
            disabled={disabled}
            label={text.slice(lastIndex, match.index)}
          />
        );
      }
  
      parts.push(
        <Label
          component="a"
          customHref={match[2]}
          target="_blank"
          variantSize="regular14"
          variantColor="orange"
          offUserSelect
          disabled={disabled}
          label={match[1]}
        />
      );
  
      lastIndex = regex.lastIndex;
    }
  
    if (lastIndex < text.length) {
      parts.push(
        <Label
          component="span"
          variantSize="regular14"
          variantColor="gray"
          offUserSelect
          disabled={disabled}
          label={text.slice(lastIndex)}
        />
      );
    }
  
    return parts;
  }

  return {
    renderTextWithLinks,
  };
}
