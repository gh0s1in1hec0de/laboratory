import {useIsConnectionRestored, useTonAddress, useTonConnectUI, useTonWallet} from "@tonconnect/ui-react";
import {useState} from "react";

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

  const body = {
    validUntil: Math.floor(Date.now() / 1000) + 360,
    messages: [
      {
        amount: "10000000",
        address: "EQBx3ogufv7zZlqNqvGsnhGOfsIprcyKnMEe04KSREQAEG3z"
      }
    ]
  }

  const onClick = async () => {
    if (!wallet) {
      await tonConnectUI.openModal();
    } else {
      setIsLoadingTransaction(true)
      try {
        await tonConnectUI.sendTransaction(body);
        // const txResult = await tonConnectUI.sendTransaction(body);
        // const exBoc = txResult.boc;

        // const txRes = await getTxByBOC(exBoc, address);
        // console.log(txRes);

        // console.log(txResult)
      } catch (e) {
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