import {beginCell, Cell} from "@ton/core";

export enum Ops {
    core_init = 0x18add407,
    create_launch = 0x0eedbf42,
}

export enum Errors {}

// Extend with https://github.com/ton-blockchain/TEPs/blob/master/text/0064-token-data-standard.md
export type TEP64JettonMetadata = {
    uri: string
};

export function TEP64MetadataToCell(content: TEP64JettonMetadata): Cell {
    return beginCell()
        .storeStringRefTail(content.uri) //Snake logic under the hood
        .endCell();
}



