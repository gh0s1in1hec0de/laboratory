import {beginCell, Cell} from "@ton/core";

export enum Ops {
    core_init = 0x15ec7a91,
    tl_init_callback = 0x15ec7a91,
    create_launch = 0x5a4aa3d3,
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



