import {Address, fromNano, Slice, toNano, Transaction} from '@ton/core';
import {AddressSaver} from '../wrappers/AddressSaver';
import {compile, NetworkProvider} from '@ton/blueprint';
import {TonClient} from '@ton/ton';
import {log} from "node:util";
import {randomAddress} from "@ton/test-utils";
import {parseBodyInternalMessage} from "./utils/parseBodyInternalMessage";
import {parseBodyExternalInMessage} from "./utils/parseBodyExternalInMessage";

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

  const randomAddr = Address.parse("EQAgGgnGzKreSLnpZHxM3mFUa2r6CKeuzHdWC6W1p89KmsJT");
  // await addressSaver.sendRequestAddress(provider.sender(), toNano(0.02), 12345n);
  await addressSaver.sendChangeAddress(provider.sender(), toNano(0.02), 12345n, randomAddr);

  const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: '588cb5d0c59bdcee3f1f7810ff13284b7d89aa481481c02843587c6b43e07e82',
  });

  const transactions: Transaction[] = await client.getTransactions(senderAddress, {
    // if call sendChangeAddress
    limit: 1,
    // if call sendRequestAddress
    // limit: 2,
  });

  console.log(transactions);

  for (const tx of transactions) {
    console.log("-----------------------------------------------------------------------------")
    console.log("Start parsing transactions...")
    const inMessage = tx.inMessage;
    const outMessages = tx.outMessages;
    console.log("IN MESSAGE:")
    console.log(inMessage)
    console.log(`OUT MESSAGES COUNT: ${outMessages.values().length}`)
    outMessages.values().map(msg => {
      console.log(msg);
    })

    // parse "InMessage" - external-in
    if (inMessage?.info.type == 'external-in') {
      const resultParse = parseBodyExternalInMessage(inMessage);
      console.log(resultParse)

      outMessages.values().map(msg => {
        // if transaction have internal message in "outMessages"
        if (msg?.info.type == 'internal') {
          const sender = msg.info.src;
          const value = msg.info.value.coins;
          const resultParse = parseBodyInternalMessage(msg, sender, value);
          console.log(resultParse)
        }

        if (msg?.info.type == 'external-out') {
          // todo
        }
      })
    }

    // parse "InMessage" - internal
    if (inMessage?.info.type == 'internal') {
      const sender = inMessage.info.src;
      const value = inMessage.info.value.coins;
      const resultParse = parseBodyInternalMessage(inMessage, sender, value);
      console.log(resultParse)
    }
  }
}