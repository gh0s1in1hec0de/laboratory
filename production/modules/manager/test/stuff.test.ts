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
    test.skip("timings", async () => {
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
            const address = Address.parse("UQA2-Rk_TJmNX8rJ6BgYqJzVEW5Sw776ppmLy8AF94v6HZix");
            console.log(address.toRawString());
        } catch (e) {
            isAddress = false;
        }
        console.log(`is address: ${isAddress}`);
    });
    test.skip("convert list", async () => {
        const addresses = [
            "UQAw0N_a2I6nDQuqxwT7nsvYhJ87sKLjJT3-dN-k260aToOc",
            "UQAQzZmWmHJpHjSJ7YenYhxuNmUVao-ph6E2V5HX6Gp88Poh",
            "UQC1h1AoOS3IU-3IEh_A0Zlb7bEwz_xdXcxQVQEcW8DaPVlG",
            "UQCgOdfQRrXhJsHyeKQvCPZ57MYKk3GNN4ZRKVFBYUX-mWvI",
            "UQDHR2jbTN8MVid7WgvEMNeKyReaJayHYbD7Xmh0uJZywsIk",
            "UQBMa1Daw0W9Jq6rOZINlTSJh11vG00sS9ZTeapnw3kkbwMk",
            "UQDMvEi4nuiaPIditYujmGwqKOUdyzYzykfJfaJwNrfiDWPY",
            "UQD1qbJl7WzmMx2XV4EoJXZM3NsSlBMfgq54DMpFPbNeDrcQ",
            "UQD1zGrePfbUre3yn2993fsYAAnY00e0NUyQ4p_n__zJhTSR",
            "UQASpqvSJ8xQftdWh8Ci0jMBBxSSvcl8hjiuiIDznSsBQHy_",
            "UQACdLAWZOJDFzVHkxD0hM005Csvy0Ja9IdOZ9ipbNKOpgr5",
            "UQA3JunEJEYyRgIWwlFk9ghmqkKUHZTgVCnqkJWv-5aoLKBb",
            "UQBMkzSC9-zOauZcjWOg9W03iw-wRX277xxX-4dYrfpcxgpG",
            "UQC7IHqmSzKA38s5LaYmxv6mzYH_cLHtXrAeri3wqAvz_fLk",
            "UQA_lIGur07St9hCATqOBH2zKhCHHNDS4nARNwB3g8FyBslL",
            "UQAeLrvdxb9Qya6xMT8VDSIbK9i9v7DkVIOi3vns8KXPFVgi",
            "UQAZQ0mPeFNqEVbiKjg7xMH8WnnNgHrhfb6FRpUDfadNCWQD",
            "UQA0AVBdW_e6bRoR8SbMEHPeSu5J_XBZGSWm-xwugqLMSqqD",
            "UQAW6PtWltzeYPa-62XGKBQUWQEWY3KcRV-CtwS_TyAKPkg_",
            "UQBDiWmgKLawpD-bvmry3YU1bBAQE7psd1NphL1_GUkUL439",
            "UQBl9Z2jHCDEB-wbogKGkhtgAxucv1Uf2dhAFw36cusPVQl-",
            "UQBLa9Fc2dUAp439zCawLmZ9bIDeJR0Zhsh2CQIyk9OURmZY",
            "UQAfdWVgK3Nifdh4LXScjg-Y4SPdL30mFlJ5tAFEi8PG9HAf",
            "UQAAJlaAvu5I8BJgThs4RwlbOPRiDa_f3_ZRDaTyD_O9GdQY",
            "UQD5P3u7wa_ObTaErkF7gZkJQhDUoYI9yHd2kF-_jhzVO4NA",
            "UQATBHzrZhgFIuAqwT85zkpY3EU0IQtaqesoKO--fFOFoPSs",
            "UQBjvVu3pXzIwGhP6vmQ7lD7JocCvADDiccP_clRSO3KklAb",
            "UQAxqr6pcvWWhzJrHsu0exUmw0t1r5vLzWeJWDqgAjYseKGu",
            "UQD1H23NWR1QZ2bf1-mstJrUes6mCgC2yzstsnRhMnbcbpA3",
            "UQDnuVYTYCfnDheE7XavjU0vpOSnuMrfqVBhxj-kig9HPLYf",
            "UQAE_vyAeQ2ZkViRoZX5IuGLMVs9Q4qUVf_PjCmjfpApvM3O",
            "UQBKLJARFeeQsM6naS2FOdL-dqDzxuNJTIbuCMgSiuoFgXqK",
            "UQDWjlXNHduEJlijWy5Adgl6sVs9pk8W-HeYkG-1NfNKtgKt",
            "UQBr_hTDeEo2aCJJHluaQ1sPhic_gWyc_hBBKMxd6pX1Qwp_",
            "UQDs5SfApqXenrcDxbTjzMAk3kI2bYai26-nZ-SgXtsZnXet",
            "UQCwO8rJat8T80fZRvhx3R4FcEkxX9Pa2BNXP0btUoUk8Wx8"
        ];

        for (const address of addresses) {
            console.log(`'${Address.parse(address).toRawString()}',`);
        }
    });
    test("Fetch and filter routers", async () => {
        const response = await fetch("https://api.ston.fi/v1/routers");
        if (!response.ok) throw new Error(`Fetch error: ${response.statusText}`);

        const data = await response.json();
        const filteredRouters = data.router_list.filter((router: any) =>
            router.pton_version === "2.1" &&
            router.major_version === 2 &&
            router.pool_creation_enabled === true
        );

        console.log("Filtered Routers:", filteredRouters);
        if (!filteredRouters.length) console.warn("No routers matched the criteria.");
    });
});
