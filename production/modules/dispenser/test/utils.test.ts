import { randomAddress } from "@ton/test-utils";
import { describe, test } from "bun:test";

describe("Utils", () => {
    test("generate random address", async () => {
        for (let i = 0; i < 5; i++) {
            const r = randomAddress();
            console.log(`[${r}, ${r.toRawString()}]`);
        }
    });

});