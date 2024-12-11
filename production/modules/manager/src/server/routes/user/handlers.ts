import { CommonServerError, parseLocaledText } from "starton-periphery";
import { Address } from "@ton/core";
import * as db from "../../../db";
import type {
    GetCallerTicketBalanceRequest,
    ConnectCallerWalletRequest,
    GetWhitelistStatusRequest,
    GetCallerTasksResponse,
    GetCallerTasksRequest,
    RawAddressString,
    Subtask,
    Caller,
    GetCallerRequest
} from "starton-periphery";

export async function connectCallerWallet(
    { address, referral, }: ConnectCallerWalletRequest
): Promise<Caller | string> {
    let maybeParsedReferral: RawAddressString | undefined = undefined;
    if (referral) {
        try {
            maybeParsedReferral = Address.parse(referral).toRawString();
        } catch (e) {
            throw new CommonServerError(400, `invalid referral ${referral}`);
        }
    }
    const res = await db.connectWallet(
        Address.parse(address).toRawString(), maybeParsedReferral,
    );
    return res ?? "user already exists";
}

export async function getCallerTicketBalance(
    { address }: GetCallerTicketBalanceRequest
): Promise<number> {
    const res = await db.getTicketBalance(Address.parse(address).toRawString());
    if (res === null) throw new CommonServerError(400, `user with address not found: ${address}`);
    return res;
}

export async function getCallerTasks(
    { staged, address }: GetCallerTasksRequest
): Promise<GetCallerTasksResponse> {
    // Have mercy on our sinful souls, O Lord
    const tasks = await db.getTasks(staged === "true");
    if (!tasks) return [];

    const usersTasksRelations = address ? await db.getUsersTasksRelations(Address.parse(address).toRawString()) : null;
    return Promise.all(
        tasks.map(task => ({
            ...task,
            completed: usersTasksRelations?.some(relation => relation.taskId === task.taskId) ?? false,
        }))
    );
}

export async function getWhitelistStatus(
    { tokenLaunch, callerAddress }: GetWhitelistStatusRequest
): Promise<boolean> {
    return db.checkWhitelistStatus(tokenLaunch, callerAddress);
}

export async function getCaller(
    { address }: GetCallerRequest
): Promise<Caller> {
    const res = await db.getCaller(address);
    if (res === null) throw new CommonServerError(400, `user with address not found: ${address}`);
    return res;
}
