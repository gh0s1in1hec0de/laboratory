import { beforeAll, describe, test } from "bun:test";
import { Address } from "@ton/core";

describe("Addresses", () => {
    beforeAll(async () => {

    });
    test("Is address?", async () => {
        let isAddress = true;
        try {
            Address.parse("0x90C293D9b084Ded40A6f1Aa0B3D34c628a1E04e8");
        } catch (e) {
            isAddress = false;
        }
        console.log(`is address: ${isAddress}`);
    });
});
