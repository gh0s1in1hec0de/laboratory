import {Address, fromNano, Message, Slice} from "@ton/core";

interface InternalMessageParams {
  op: number;
  queryId: number;
  remainingBits: number;
  memorizedAddress?: Address;
  managerAddress?: Address;
  newAddress?: Address;
}

export function parseBodyInternalMessage(message: Message, sender: Address, value: bigint): InternalMessageParams {
  console.log("START PARSE BODY OF 'Internal Message'...")

  const originalBody = message.body.beginParse()
  const slice = originalBody.clone();

  const remainingBits = slice.remainingBits

  if (slice.remainingBits < 32) {
    // if slice doesn't have opcode: it's a simple message without comment
    console.log(`Simple transfer from ${sender} with value ${fromNano(value)} TON`);
    return {} as InternalMessageParams;
  }

  const op = slice.loadUint(32);
  const queryId = slice.loadUint(64);

  // Call sendRequestAddress
  if (op === 2) {
    console.log("END PARSE BODY OF 'Internal Message'...")
    return {
      op,
      queryId,
      remainingBits
    }
  }

  // Call contract
  if (op === 3) {
    let memorizedAddress = slice.loadAddress();
    let managerAddress = slice.loadAddress();
    console.log("END PARSE BODY OF 'Internal Message'...")
    return {
      op,
      queryId,
      remainingBits,
      memorizedAddress,
      managerAddress
    }
  }

  const newAddress = slice.loadAddress();

  console.log("END PARSE BODY OF 'Internal Message'...")
  //  Call sendChangeAddress op === 1
  return {
    op,
    queryId,
    remainingBits,
    newAddress
  }
}