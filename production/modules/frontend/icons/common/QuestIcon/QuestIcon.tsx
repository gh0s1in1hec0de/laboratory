export function QuestIcon({ variant }: {variant: "middle" | "first" | "last"}) {

  function renderContent(variant: "middle" | "first" | "last") {
    switch (variant) {
    case "first":
      return (
        <svg width="40" height="39" viewBox="0 0 40 39" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.5 38C19.5 38.2761 19.7239 38.5 20 38.5C20.2761 38.5 20.5 38.2761 20.5 38H19.5ZM19.5 24V38H20.5V24H19.5Z" fill="#9B9DA0"/>
          <path d="M20 1V1C21.986 6.60479 26.3952 11.014 32 13V13V13C26.3952 14.986 21.986 19.3952 20 25V25V25C18.014 19.3952 13.6048 14.986 8 13V13V13C13.6048 11.014 18.014 6.60479 20 1V1Z" stroke="#9B9DA0"/>
        </svg>
      );
    case "last":
      return (
        <svg width="40" style={{ transform: "rotate(180deg)" }} height="39" viewBox="0 0 40 39" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.5 38C19.5 38.2761 19.7239 38.5 20 38.5C20.2761 38.5 20.5 38.2761 20.5 38H19.5ZM19.5 24V38H20.5V24H19.5Z" fill="#9B9DA0"/>
          <path d="M20 1V1C21.986 6.60479 26.3952 11.014 32 13V13V13C26.3952 14.986 21.986 19.3952 20 25V25V25C18.014 19.3952 13.6048 14.986 8 13V13V13C13.6048 11.014 18.014 6.60479 20 1V1Z" stroke="#9B9DA0"/>
        </svg>
      );
    case "middle":
    default:
      return (
        <svg width="40" height="52" viewBox="0 0 40 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.5 51C19.5 51.2761 19.7239 51.5 20 51.5C20.2761 51.5 20.5 51.2761 20.5 51H19.5ZM19.5 37V51H20.5V37H19.5Z" fill="#9B9DA0"/>
          <path d="M19.5 14C19.5 14.2761 19.7239 14.5 20 14.5C20.2761 14.5 20.5 14.2761 20.5 14H19.5ZM19.5 0V14H20.5V0H19.5Z" fill="#9B9DA0"/>
          <path d="M20 14V14C21.986 19.6048 26.3952 24.014 32 26V26V26C26.3952 27.986 21.986 32.3952 20 38V38V38C18.014 32.3952 13.6048 27.986 8 26V26V26C13.6048 24.014 18.014 19.6048 20 14V14Z" stroke="#9B9DA0"/>
        </svg>
      );
    }
  }

  return renderContent(variant);
}
