import {Address, BitString, Message} from "@ton/core";

interface RefParams {
  uselessInfo: BitString;
  destAddress: Address;
//   ...more
}

interface ExternalInParams {
  signature: BitString;
  subwallet_id: number;
  valid_until: number;
  seqno: number;
  op: BitString;
  mode: BitString;
  remainingBits: number;
  refs: RefParams[] | null;
}

export function parseBodyExternalInMessage(message: Message): ExternalInParams {
  console.log("START PARSE BODY OF 'ExternalIn Message'...")

  const originalBody = message.body.beginParse()
  const slice = originalBody.clone();

  const remainingBits = slice.remainingBits

  if (slice.remainingBits < 32) {
    console.log("BODY DON`T HAVE OP CODE");
    return {} as ExternalInParams;
  }

  const signature = slice.loadBits(512)
  const subwallet_id = slice.loadUint(32)
  const valid_until = slice.loadUint(32)
  const seqno = slice.loadUint(32)
  const op = slice.loadBits(8)
  const mode = slice.loadBits(8)

  const refsArray: RefParams[] = [];

  try {
    while (true) {
      const ref = slice.loadRef().beginParse()
      const uselessInfo = ref.loadBits(6);
      const destRaw = ref.loadAddress();
      const destAddress = Address.parse(destRaw.toString())
      refsArray.push({uselessInfo, destAddress});
    }
  } catch (e) {
    console.log("All Refs of 'ExternalIn Message' detected!")
  }

  if (refsArray){
    console.log("END PARSE BODY OF 'ExternalIn Message'...")
    return {
      signature,
      subwallet_id,
      valid_until,
      seqno,
      op,
      mode,
      remainingBits,
      refs: refsArray
    }
  }

  console.log("END PARSE BODY OF 'ExternalIn Message'...")
  // If no refs
  return {
    signature,
    subwallet_id,
    valid_until,
    seqno,
    op,
    mode,
    remainingBits,
    refs: null
  }
}