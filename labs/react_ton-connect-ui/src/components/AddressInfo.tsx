import {useTonAddress} from "@tonconnect/ui-react";
import {useEffect} from "react";

export function AddressInfo(){
  const address = useTonAddress();
  const rowAddress = useTonAddress(false);

  useEffect(() => {
    if (address) {
      const ws = new WebSocket(`ws://localhost:3000/api/ws?address=${address}`);

      ws.onmessage = (data) => {
        console.log('a message received');
        console.log(data);
        ws.close();
      };
    }
  }, [address]);

  return(
    <div style={{ marginBottom: "20px" }}>
      <div>Address: {address}</div>
      <div>Row Address: {rowAddress}</div>
    </div>
  )
}