import {Address, Message} from "@ton/core";
import {ExternalInMessageActions, ParsingBodyOfExternalInMessageResult, RefInfo} from "./types";

export function parseBodyOfExternalInMessage(message: Message): ParsingBodyOfExternalInMessageResult {
  console.log("Start parsing body of 'ExternalIn Message'")

  const originalBody = message.body.beginParse();
  const bodyToParse = originalBody.clone();
  const allBitsCount = bodyToParse.remainingBits;

  if (bodyToParse.remainingBits < 32) {
    return {
      info: {
        action: ExternalInMessageActions.Exception,
        exception: "Body don`t have op code"
      },
      allBitsCount: allBitsCount
    };
  }

  const signature = bodyToParse.loadBits(512)
  const subWalletId = bodyToParse.loadUint(32)
  const validUntil = bodyToParse.loadUint(32)
  const seqno = bodyToParse.loadUint(32)
  const op = bodyToParse.loadBits(8)
  const mode = bodyToParse.loadBits(8)

  const refsArray: RefInfo[] = [];

  try {
    while (true) {
      const refBody = bodyToParse.loadRef().beginParse()
      const additionalInfo = refBody.loadBits(6);
      const destAddress = Address.parse(refBody.loadAddress().toString());
      refsArray.push({
        destAddress: destAddress,
        additionalInfo: additionalInfo
      });
    }
  } catch (e) {
    console.log("All Refs of 'ExternalIn Message' are processed")
  }

  console.log("End parsing body of 'ExternalIn Message'")
  return {
    info: {
      action: ExternalInMessageActions.Complex,
      signature,
      subWalletId,
      validUntil,
      seqno,
      op: Number(op),
      mode: Number(mode),
      refs: refsArray ? refsArray : null
    },
    allBitsCount,
    remainingBitsCount: bodyToParse.remainingBits
  }
}