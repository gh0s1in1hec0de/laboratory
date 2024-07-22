// import {Address, TonClient} from "@ton/ton";
//
// const client = new TonClient({
//   endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
//   apiKey: '588cb5d0c59bdcee3f1f7810ff13284b7d89aa481481c02843587c6b43e07e82',
// });
//
// async function retry<T>(fn: () => Promise<T>, options: { retries: number, delay: number }): Promise<T> {
//   let lastError: Error | undefined;
//   for (let i = 0; i < options.retries; i++) {
//     try {
//       return await fn();
//     } catch (e) {
//       if (e instanceof Error) {
//         lastError = e;
//       }
//       await new Promise(resolve => setTimeout(resolve, options.delay));
//     }
//   }
//   throw lastError;
// }
//
//
// export async function getTxByBOC(exBoc: string, address: string): Promise<string> {
//   const myAddress = Address.parse(address);
//
//   return retry(async () => {
//     const transactions = await client.getTransactions(myAddress, {
//       limit: 5,
//     });
//
//     console.log(transactions)
//
//     return ""
//
//   }, {retries: 30, delay: 1000});
// }