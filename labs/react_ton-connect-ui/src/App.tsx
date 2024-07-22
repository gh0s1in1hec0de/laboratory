import {TonConnectButton} from "@tonconnect/ui-react";
import {WalletInfo} from "./components/WalletInfo.tsx";
import {AddressInfo} from "./components/AddressInfo.tsx";
import {SendTransaction} from "./components/SendTransaction.tsx";
import {Settings} from "./components/Settings.tsx";

function App() {

  return (
    <div>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ margin: 0 }}>My app</h2>
        <TonConnectButton/>
      </header>
      <div style={{ height: "140px" }}>
        <AddressInfo/>
        <WalletInfo/>
      </div>
      <SendTransaction/>
      <Settings/>
    </div>
  )
}

export default App
