import {Address, Message} from "@ton/core";
import {
  InternalMessageActions,
  InternalMessageInfo,
  InternalMessageOpCodes,
  ParsingBodyOfInternalMessageResult,
} from "./types";

export function parseBodyOfInternalMessage(
  message: Message,
  sender: Address,
  value: bigint
): ParsingBodyOfInternalMessageResult {
  console.log("Start parsing body of 'Internal Message'")

  const originalBody = message.body.beginParse()
  const bodyToParse = originalBody.clone();
  const allBitsCount = bodyToParse.remainingBits;

  if (bodyToParse.remainingBits < 32) {
    console.log("End parsing body of 'Internal Message'")
    return {
      info: {
        action: InternalMessageActions.SimpleTransferCalled,
        sender: sender,
        value: value,
      },
      allBitsCount: allBitsCount,
    };
  }

  // if the op code does not match any of the provided
  let info: InternalMessageInfo = {
    action: InternalMessageActions.UnknownStructureCalled,
    value,
    sender,
    originalBody,
  };

  const op = bodyToParse.loadUint(32);
  const queryId = bodyToParse.loadUint(64);

  switch (op) {
    case InternalMessageOpCodes.RequestAddressCalled:
      info = {
        action: InternalMessageActions.RequestAddressCalled,
        op,
        queryId
      };
      break;
    case InternalMessageOpCodes.ContractCalled:
      info = {
        action: InternalMessageActions.ContractCalled,
        op,
        queryId,
        memorizedAddress: bodyToParse.loadAddress(),
        managerAddress: bodyToParse.loadAddress(),
      };
      break;
    case InternalMessageOpCodes.ChangeAddressCalled:
      info = {
        action: InternalMessageActions.ChangeAddressCalled,
        op,
        queryId,
        newAddress: bodyToParse.loadAddress(),
      };
      break;
  }

  const remainingBitsCount = bodyToParse.remainingBits;

  console.log("End parsing body of 'Internal Message'")
  return {
    info,
    allBitsCount,
    remainingBitsCount
  };
}