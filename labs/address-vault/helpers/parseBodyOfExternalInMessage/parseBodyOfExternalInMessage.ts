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

  const refs: RefInfo[] = [];

  while (true){
    try {
      const refBody = bodyToParse.loadRef().beginParse()
      const additionalInfo = refBody.loadBits(6);
      const destAddress = Address.parse(refBody.loadAddress().toString());
      refs.push({
        destAddress,
        additionalInfo
      });
    } catch {
      break;
    }
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
      refs: refs.length ? refs : null
    },
    allBitsCount,
    remainingBitsCount: bodyToParse.remainingBits
  }
}