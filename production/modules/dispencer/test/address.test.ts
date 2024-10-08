import { beforeAll, describe, test } from "bun:test";
import { Address } from "@ton/core";

describe("Database", () => {

    beforeAll(async () => {

    });
    test("Add mock data to the database", async () => {
        let isAddress = true;
        try {
            Address.parse("0:57b14c1667a2bd7d7b3fce9a7450034fe7c3ced5da3607dd55bdeeea28283d19");
        } catch (e) {
            isAddress = false;
        }
        console.log(`is address: ${isAddress}`);
    });

});
