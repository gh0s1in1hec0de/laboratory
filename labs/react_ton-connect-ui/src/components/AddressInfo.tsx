import {useTonAddress} from "@tonconnect/ui-react";
import {useEffect} from "react";

let ws: WebSocket;
export function AddressInfo() {
  const tgId = "exampleTgId";
  const tokenAddress = "exampleTokenAddress";
  const address = useTonAddress();
  const rowAddress = useTonAddress(false);
  
  useEffect(() => {
    if (address) {
      ws = new WebSocket(`ws://localhost:3000/api/ws?address=${address}&tgId=${tgId}&tokenAddress=${tokenAddress}`);

      ws.onmessage = (data) => {
        console.log("a message received");
        console.log(data);
        // ws.close();
      };
    }
  }, [ws, address]);
  
  return (
    <div style={{marginBottom: "20px"}}>
      <div>Address: {address}</div>
      <div>Row Address: {rowAddress}</div>
    </div>
  );
}