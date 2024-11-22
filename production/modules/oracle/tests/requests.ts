import { test, describe, } from "bun:test";
import dotenv from "dotenv";
import { fetchMaybeIpfsObjectWithFallback } from "starton-periphery";

dotenv.config();

describe("Requests", () => {
    test("Meow", async () => {
        await fetchMaybeIpfsObjectWithFallback("https://storage.starton.pro/ipfsQmV6cq1UzdqDHQT1PnjxW8DvZYAByUuVh8uGK3yhJcv63e");
    });
});