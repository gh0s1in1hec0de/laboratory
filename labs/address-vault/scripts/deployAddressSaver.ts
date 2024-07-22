import {Address, fromNano, Slice, toNano, Transaction} from '@ton/core';
import {AddressSaver} from '../wrappers/AddressSaver';
import {compile, NetworkProvider} from '@ton/blueprint';
import {TonClient} from '@ton/ton';

// function parseInternalMessageBody(slice: Slice): void {
//   if (slice.remainingBits >= 32) {
//     const op = slice.loadUint(32);
//     console.log(`Operation Code: ${op.toString(16)}`);
//
//     if (op === 0x7362d09c) { // Jetton transfer notification
//       parseJettonTransfer(slice);
//     } else if (op === 0x05138d91) { // NFT transfer notification
//       parseNftTransfer(slice);
//     } else if (op === 0) { // Basic transfer with comment
//       const comment = slice.loadStringTail();
//       console.log(`Transfer Comment: ${comment}`);
//     } else {
//       console.log(`Unknown operation code: ${op.toString(16)}`);
//     }
//   } else {
//     console.log('Body does not contain an operation code.');
//   }
// }

export async function run(provider: NetworkProvider) {
  const providerAddress = provider.sender().address;
  console.log(`Provider address: ${providerAddress}`);
  const senderAddress = providerAddress
    ? providerAddress
    : Address.parse('0QClQ1XYD9gcXqQtLYRuMNepTo8H9MeRswP7ptvObBrI5sCC');

  // const initialAddress = randomAddress();
  // console.log(initialAddress);
  const initialAddress = Address.parse("EQAVS6iC30Q6yM51bPVyeyQeLXCGsPocfyKGR3C9thcH6FUv");
  const addressSaver = provider.open(AddressSaver.createFromConfig(
    {manager: senderAddress, initialAddress},
    await compile('AddressSaver')
  ));

  // await addressSaver.sendDeploy(provider.sender(), toNano('0.05'));

  // await provider.waitForDeploy(addressSaver.address);

  await addressSaver.sendRequestAddress(provider.sender(), toNano(0.02), 12345n);

  const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: '588cb5d0c59bdcee3f1f7810ff13284b7d89aa481481c02843587c6b43e07e82',
  });

  const transactions: Transaction[] = await client.getTransactions(senderAddress, {
    limit: 2,
  });

  console.log(transactions);

  function parseBodyInternalInMessage(slice: Slice, sender: Address, value: bigint): void {
    console.log(`SLICE remainingBits: ${slice.remainingBits}`)
    if (slice.remainingBits < 32) {
      // if slice doesn't have opcode: it's a simple message without comment
      console.log(`Simple transfer from ${sender} with value ${fromNano(value)} TON`);
    } else {
      const op = slice.loadUint(32);
      console.log(op)

      // Basic transfer with comment
      if (op === 0) {
        const comment = slice.loadStringTail();
        console.log(`Transfer Comment: ${comment}`);
      }
    }
  }

  for (const tx of transactions) {
    console.log("------------------------------------------------------------------------")
    const inMessage = tx.inMessage;
    const outMessages = tx.outMessages;
    console.log(inMessage)
    console.log("===========================================")
    console.log(outMessages);
    console.log("===========================================")
    // outMessages.values().map(msg => {
    //   console.log(msg);
    //   // console.log(msg.in)
    //   // console.log(msg.info)
    // })

    if (inMessage?.info.type == 'internal') {
      const sender = inMessage.info.src;
      const value = inMessage.info.value.coins;

      // Convert the body from its hex representation to a Cell
      const slice = inMessage.body.beginParse().clone();
      parseBodyInternalInMessage(slice, sender, value);
    }

    if (inMessage?.info.type == 'external-in') {
      outMessages.values().map(msg => {
        console.log(msg);
        // console.log(msg.in)
        // console.log(msg.info)
        if (msg?.info.type == 'internal') {
          const sender = msg.info.src;
          const value = msg.info.value.coins;
          const slice = msg.body.beginParse().clone();
          parseBodyInternalInMessage(slice, sender, value);
        }
      })
    }
  }
}