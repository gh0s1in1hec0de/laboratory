import {compile, NetworkProvider} from '@ton/blueprint';
import {Address, toNano, Transaction} from '@ton/core';
import {AddressSaver} from '../wrappers/AddressSaver';
import {TonClient} from '@ton/ton';

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

}