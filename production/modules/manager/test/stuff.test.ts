import { beforeAll, describe, test } from "bun:test";
import { Address } from "@ton/core";

function formatTime(totalSeconds: number) {
    // Ensure we handle `totalSeconds` as a duration
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return {
        days: String(days).padStart(2, "0"),
        hours: String(hours).padStart(2, "0"),
        minutes: String(minutes).padStart(2, "0"),
        seconds: String(secs).padStart(2, "0"),
    };
}

describe("Addresses", () => {
    beforeAll(async () => {

    });
    test("timings", async () => {
        const now = Math.floor(Date.now() / 1000); // Current Unix timestamp in seconds
        const endTime = 1734151985; // End time as Unix seconds
        const remainingSeconds = endTime - now;

        if (remainingSeconds > 0) {
            const { days, hours, minutes, seconds } = formatTime(remainingSeconds);
            console.log(`Remaining time: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
        } else {
            console.log("Time has already passed!");
        }

    });
    test.skip("Is address?", async () => {
        let isAddress = true;
        try {
            Address.parse("0x90C293D9b084Ded40A6f1Aa0B3D34c628a1E04e8");
        } catch (e) {
            isAddress = false;
        }
        console.log(`is address: ${isAddress}`);
    });
});
