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

  function parseBodyInternalMessage(slice: Slice, sender: Address, value: bigint): void {
    console.log("START PARSE BODY OF 'Internal Message'...")
    console.log(`BODY remainingBits: ${slice.remainingBits}`)
    if (slice.remainingBits < 32) {
      // if slice doesn't have opcode: it's a simple message without comment
      console.log(`Simple transfer from ${sender} with value ${fromNano(value)} TON`);
    } else {
      const op = slice.loadUint(32);
      const queryId = slice.loadUint(64);
      console.log(`OP: ${op}`)
      console.log(`QUERY ID: ${queryId}`)


      let memorizedAddress;
      let managerAddress;
      if (op === 3) {
        memorizedAddress = slice.loadAddress();
        managerAddress = slice.loadAddress();
      }
      console.log(`managerAddress: ${managerAddress}`)
      console.log(`memorizedAddress: ${memorizedAddress}`)


      console.log("END PARSE BODY OF 'Internal Message'...")
    }
  }

  function parseBodyExternalInMessage(slice: Slice) {
    console.log("START PARSE BODY OF 'ExternalIn Message'...")
    console.log(`'ExternalIn' BODY remainingBits: ${slice.remainingBits}`)
    if (slice.remainingBits < 32) {
      console.log("BODY DON`T HAVE OP CODE");
      return;
    } else {
      const op = slice.loadUint(32); // Load the operation code (32 bits)
      const queryId = slice.loadUint(64); // Load the query ID (64 bits)
      console.log(`OP: ${op}`)
      console.log(`QUERY ID: ${queryId}`)

      /*
       Если входящее сообщение имеет "op === 1", то вызвалась функция sendChangeAddress,
       которая в свою очередь должна содержать новый op, queryId и address для обновления
       */
      let newAddress;
      if (op === 1) {
        // Example case where additional parameters are loaded for op = 1
        newAddress = slice.loadAddress(); // Next field: new Address
        console.log(`NEW ADDRESS: ${newAddress}`)
        return {op, queryId, newAddress};
      } else if (op === 2) {
        /*
       Если входящее сообщение имеет "op === 2", то вызвалась функция sendRequestAddress,
       которая в свою очередь должна содержать op и queryId
       */
        return {op, queryId};
      }

      console.log("END PARSE BODY OF 'ExternalIn Message'...")

      return {
        op,
        queryId,
        newAddress: newAddress || null
      }
    }
  }


  for (const tx of transactions) {
    console.log("------------------------------------------------------------------------")
    const inMessage = tx.inMessage;
    const outMessages = tx.outMessages;
    console.log("IN MESSAGE:")
    console.log(inMessage)
    console.log("===========================================")
    console.log("OUT MESSAGES:")
    console.log(outMessages);
    outMessages.values().map(msg => {
      console.log(msg);
    })

    // parse "InMessage" - external-in
    if (inMessage?.info.type == 'external-in') {
      const slice = inMessage.body.beginParse().clone();
      // TODO хуйня
      parseBodyExternalInMessage(slice);

      outMessages.values().map(msg => {
        // if transaction have internal message in "outMessages"
        if (msg?.info.type == 'internal') {
          const sender = msg.info.src;
          const value = msg.info.value.coins;
          const slice = msg.body.beginParse().clone();
          parseBodyInternalMessage(slice, sender, value);
        }

        if (msg?.info.type == 'external-out') {

        }
      })
    }

    // parse "InMessage" - internal
    if (inMessage?.info.type == 'internal') {
      const sender = inMessage.info.src;
      const value = inMessage.info.value.coins;

      // Convert the body from its hex representation to a Cell
      const slice = inMessage.body.beginParse().clone();
      parseBodyInternalMessage(slice, sender, value);
    }
  }
}