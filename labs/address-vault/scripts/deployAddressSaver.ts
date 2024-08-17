import {Address, toNano, Transaction} from '@ton/core';
import {AddressSaver} from '../wrappers/AddressSaver';
import {compile, NetworkProvider} from '@ton/blueprint';
import {TonClient} from '@ton/ton';
import {parseBodyOfExternalInMessage, parseBodyOfInternalMessage} from "../helpers";
import {InternalMessageActions} from "../helpers/parseBodyOfInternalMessage/types";
import {ExternalInMessageActions} from "../helpers/parseBodyOfExternalInMessage/types";
import {hash} from "crypto";

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


  let limit;
  const contactAddress = Address.parse("kQBx3ogufv7zZlqNqvGsnhGOfsIprcyKnMEe04KSREQAENZ5");
  let createdLt;


  // await addressSaver.sendRequestAddress(provider.sender(), toNano(0.02), 12345n);
  // limit = 2;

  limit = 1;
  // const randomAddr = Address.parse("EQAgGgnGzKreSLnpZHxM3mFUa2r6CKeuzHdWC6W1p89KmsJT");
  // await addressSaver.sendChangeAddress(provider.sender(), toNano(0.02), 12345n, randomAddr);

  const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: '588cb5d0c59bdcee3f1f7810ff13284b7d89aa481481c02843587c6b43e07e82',
  });

  /** work */
  // const transactions: Transaction[] = await client.getTransactions(senderAddress, {
  //   limit: limit,
  // });

  /** work */
  // let ltTx = "24869877000001";
  // let hashTx = "5a3ac47de92fe5dcea13310370f1b77b2cd7729a7ac6c2a67b0065f8d4e76c28";
  // const hashBits = Buffer.from(hashTx, 'hex')
  // const transaction: Transaction | null = await client.getTransaction(senderAddress, ltTx, hashBits.toString("base64"))
  // console.log(transaction);

  /** work (find external-in message) */
  // createdLt = "24869877000002";
  // const transaction: Transaction = await client.tryLocateSourceTx(senderAddress, contactAddress, createdLt)
  // console.log(transaction);

  /** work (find internal message) */
  // createdLt = "24869877000002";
  // const transaction: Transaction = await client.tryLocateResultTx(senderAddress, contactAddress, createdLt)
  // console.log(transaction);

  // todo TEST THIS
  //
  // for (const tx of transactions) {
  //   console.debug("-----------------------------------------------------------------------------")
  //   const inMessage = tx.inMessage;
  //   const outMessages = tx.outMessages;
  //   console.log("IN MESSAGE:")
  //   console.log(inMessage)
  //   console.log(`OUT MESSAGES COUNT: ${outMessages.values().length}`)
  //   outMessages.values().map(msg => {
  //     console.log(msg);
  //   })
  //   console.debug("-----------------------------------------------------------------------------")
  //
  //   // parse "InMessage" - external-in
  //   if (inMessage?.info.type == 'external-in') {
  //     const resultParse = parseBodyOfExternalInMessage(inMessage);
  //     console.log(resultParse)
  //
  //     outMessages.values().map(message => {
  //       // if transaction have internal message in "outMessages"
  //       if (message?.info.type == 'internal') {
  //         const sender = message.info.src;
  //         const value = message.info.value.coins;
  //         const resultParse = parseBodyOfInternalMessage(message, sender, value);
  //         if (resultParse.info.action === InternalMessageActions.UnknownStructureCalled){
  //           resultParse.info
  //         }
  //         console.log(resultParse)
  //       }
  //
  //       if (message?.info.type == 'external-out') {
  //         // todo optional
  //       }
  //     })
  //   }
  //
  //   // parse "InMessage" - internal
  //   if (inMessage?.info.type == 'internal') {
  //     const sender = inMessage.info.src;
  //     const value = inMessage.info.value.coins;
  //     const resultParse = parseBodyOfInternalMessage(inMessage, sender, value);
  //     console.log(resultParse)
  //   }
  // }
}