import { beforeAll, describe, test } from "bun:test";
import { Address } from "@ton/core";

describe("Database", () => {

    beforeAll(async () => {

    });
    test("Add mock data to the database", async () => {
        let isAddress = true;
        try {
            Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw");
        } catch (e) {
            isAddress = false;
        }
        console.log(`is address: ${isAddress}`);
        console.log(Address.parse("0QBXsUwWZ6K9fXs_zpp0UANP58PO1do2B91Vve7qKCg9GXWw").toRawString());
    });

});
