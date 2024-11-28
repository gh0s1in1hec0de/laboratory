import { test, describe, } from "bun:test";
import dotenv from "dotenv";
import { Address } from "@ton/ton";

dotenv.config();

describe("Requests", () => {
    test("Meow", async () => {
        console.log(Address.parse("kQAMDg4QBDq2XCVtq8w3j2bpR2xg6DkomcGnuvnsNbv3owLk").toString());
    });
});