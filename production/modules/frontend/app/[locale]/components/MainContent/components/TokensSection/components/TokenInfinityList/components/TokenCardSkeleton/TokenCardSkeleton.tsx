export function TokenCardSkeleton() {
  return <div style={{ height: "500px" }}>TokenCardSkeleton</div>;
}

export function getSkeletons() {
  return new Array(10)
    .fill(0)
    .map((_, index) => <TokenCardSkeleton key={index} />);
}
