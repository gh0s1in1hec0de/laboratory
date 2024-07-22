import {useTonAddress} from "@tonconnect/ui-react";

export function AddressInfo(){
  const address = useTonAddress();
  const rowAddress = useTonAddress(false);

  return(
    <div style={{ marginBottom: "20px" }}>
      <div>Address: {address}</div>
      <div>Row Address: {rowAddress}</div>
    </div>
  )
}