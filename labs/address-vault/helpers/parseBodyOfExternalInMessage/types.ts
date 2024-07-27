import {Address, BitString} from "@ton/core";

export enum ExternalInMessageActions {
  Complex = 'Complex',
  Exception = 'Exception',
}

interface ExternalInMessageBase {
  action: ExternalInMessageActions;
}

interface AdditionalRefInfo {
  // if you need to get any additional information...
}

export interface RefInfo {
  destAddress: Address;
  additionalInfo: BitString;
  // additionalInfo: AdditionalRefInfo
}

interface ComplexExternalInMessage extends ExternalInMessageBase {
  action: ExternalInMessageActions.Complex;
  signature: BitString;
  subWalletId: number;
  validUntil: number;
  seqno: number;
  op: number;
  mode: number;
  refs: RefInfo[] | null;
}

interface ExceptionExternalInMessage extends ExternalInMessageBase {
  action: ExternalInMessageActions.Exception;
  exception: string;
}

type ExternalInMessageInfo = ComplexExternalInMessage | ExceptionExternalInMessage

export interface ParsingBodyOfExternalInMessageResult {
  // main
  info: ExternalInMessageInfo;

  // additional
  allBitsCount?: number;
  remainingBitsCount?: number;
}