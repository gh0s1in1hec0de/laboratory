import {useTonWallet} from "@tonconnect/ui-react";

export function WalletInfo(){
  const wallet = useTonWallet();

  if (!wallet){
    return null;
  }

  // console.log(wallet)

  return(
    <div style={{ marginBottom: "20px" }}>
      <img src={wallet.imageUrl} height="30px" width="30px"/>
    </div>
  )
}