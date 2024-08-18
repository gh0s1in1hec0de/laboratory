import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider, fromNano,
    Sender,
    SendMode,
    Transaction
} from '@ton/core';
import { randomAddress } from '@ton/test-utils';
import { TonClient } from '@ton/ton';

export type AddressSaverConfig = {
    manager: Address,
    initialAddress: Address
};

export function addressSaverConfigToCell(config: AddressSaverConfig): Cell {
    return beginCell().storeAddress(config.manager).storeAddress(config.initialAddress).endCell();
}

export class AddressSaver implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new AddressSaver(address);
    }

    static createFromConfig(config: AddressSaverConfig, code: Cell, workchain = 0) {
        const data = addressSaverConfigToCell(config);
        const init = { code, data };
        return new AddressSaver(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            // TODO figure out body purpose, when deploying
            body: beginCell().endCell()
        });
    }

    async sendChangeAddress(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint, newAddress: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            // op, query_id, address
            body: beginCell().storeUint(1, 32).storeUint(queryId, 64).storeAddress(newAddress).endCell()
        });
    }

    async sendRequestAddress(provider: ContractProvider, via: Sender, value: bigint, queryId: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            // op, query_id
            body: beginCell().storeUint(2, 32).storeUint(queryId, 64).endCell()
        });
    }
}