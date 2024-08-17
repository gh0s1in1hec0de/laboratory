import {useIsConnectionRestored, useTonAddress, useTonConnectUI, useTonWallet} from "@tonconnect/ui-react";
import {useState} from "react";
import {beginCell} from "@ton/ton";

export function SendTransaction() {
  const isConnectionRestored = useIsConnectionRestored();
  const wallet = useTonWallet();
  const [tonConnectUI] = useTonConnectUI();
  const [isLoadingTransaction, setIsLoadingTransaction] = useState(false);
  // 0QClQ1XYD9gcXqQtLYRuMNepTo8H9MeRswP7ptvObBrI5sCC
  const address = useTonAddress();

  let content: string;
  switch (true) {
    case !isConnectionRestored:
      content = "Loading...";
      break;
    case isLoadingTransaction:
      content = "Transaction in progress...";
      break;
    case !!wallet:
      content = 'Send Transaction';
      break;
    default:
    case !wallet:
      content = 'Connect Wallet';
      break;
  }

  const body = beginCell()
    .storeUint(0, 32) // write 32 zero bits to indicate that a text comment will follow
    .storeStringTail("spent two hours on dat shit") // write our text comment
    .endCell();

  const myTransaction  = {
    validUntil: Math.floor(Date.now() / 1000) + 360,
    messages: [
      {
        amount: "10000000",
        address: "kQBx3ogufv7zZlqNqvGsnhGOfsIprcyKnMEe04KSREQAENZ5",
        payload: body.toBoc().toString("base64")
      }
    ]
  }

  const onClick = async () => {
    if (!wallet) {
      await tonConnectUI.openModal();
    } else {
      setIsLoadingTransaction(true)
      try {
        const txResult = await tonConnectUI.sendTransaction(myTransaction);
        const exBoc = txResult.boc;

        console.log("OK")
        console.log(exBoc)
      } catch (e) {
        console.log("PIZDEC")
        console.log(e)
      }
      setIsLoadingTransaction(false)
    }
  }

  return (
    <button disabled={!isConnectionRestored || isLoadingTransaction} onClick={onClick} style={{ marginBottom: "20px" }}>
      {content}
    </button>
  )
}