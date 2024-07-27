import {Address, Slice} from "@ton/core";

export enum InternalMessageOpCodes {
  ContractCalled = 3,
  ChangeAddressCalled = 1,
  RequestAddressCalled = 2
}

export enum InternalMessageActions {
  ContractCalled = 'ContractCalled',
  ChangeAddressCalled = 'ChangeAddressCalled',
  RequestAddressCalled = 'RequestAddressCalled',
  SimpleTransferCalled = 'SimpleTransferCalled',
  UnknownStructureCalled = 'UnknownStructureCalled',
}

interface SimpleInternalMessageBase {
  action: InternalMessageActions;
}

interface ComplexInternalMessage extends SimpleInternalMessageBase {
  op: InternalMessageOpCodes;
  queryId: number;
}

interface InternalMessageWithContractCalled extends ComplexInternalMessage {
  action: InternalMessageActions.ContractCalled;
  op: InternalMessageOpCodes.ContractCalled;
  memorizedAddress: Address;
  managerAddress: Address;
  queryId: number;
}

interface InternalMessageWithChangeAddressCalled extends ComplexInternalMessage {
  action: InternalMessageActions.ChangeAddressCalled;
  op: InternalMessageOpCodes.ChangeAddressCalled;
  newAddress: Address;
  queryId: number;
}

interface InternalMessageWithRequestAddressCalled extends ComplexInternalMessage {
  action: InternalMessageActions.RequestAddressCalled;
  op: InternalMessageOpCodes.RequestAddressCalled;
  queryId: number;
}

interface InternalMessageWithSimpleTransfer extends SimpleInternalMessageBase {
  action: InternalMessageActions.SimpleTransferCalled;
  sender: Address;
  value: bigint;
}

interface InternalMessageWithUnknownStructure extends SimpleInternalMessageBase {
  action: InternalMessageActions.UnknownStructureCalled;
  sender: Address;
  value: bigint;
  originalBody: Slice;
}

export type InternalMessageInfo =
  InternalMessageWithContractCalled |
  InternalMessageWithChangeAddressCalled |
  InternalMessageWithRequestAddressCalled |
  InternalMessageWithSimpleTransfer |
  InternalMessageWithUnknownStructure

export interface ParsingBodyOfInternalMessageResult {
  // main
  info: InternalMessageInfo;

  // additional
  allBitsCount?: number;
  remainingBitsCount?: number;
}