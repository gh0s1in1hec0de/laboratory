import { beforeAll, describe, test } from "bun:test";
import * as Signer from "@ucanto/principal/ed25519"; // Agents on Node should use Ed25519 keys
import { importDAG } from "@ucanto/core/delegation";
import { CarReader } from "@ipld/car";
import * as Client from "@web3-storage/w3up-client";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";

import dotenv from "dotenv";

dotenv.config();

const KEY = "MgCY0yfrKEmI+sXETZ/DYwhiAUvSgtHG/fNV/u8o9kyOcgO0BO5CP8QCvy9/nRGWdwV26bDbGNrXofjDv3P1Kntmb89Y=";
const PROOF =
    "EaJlcm9vdHOAZ3ZlcnNpb24BvwIBcRIgqQQTX6+nM7XCaVt555NeAvMmSX6IlRYdlACRt2fkwIeo\n" +
    "YXNYRO2hA0DnMQ0wtg9wWE6mtOwCGDS2imFf9ixBodgZSDpAhQ6rC/5Hr4K3mjQh331duvjdYP4T\n" +
    "yVVwxRVasD0ujVf6eyUNYXZlMC45LjFjYXR0gaJjY2FuYSpkd2l0aHg4ZGlkOmtleTp6Nk1rbmdq\n" +
    "WWtuWVV3V0hidGNaMVJKaGtwVUc4aGtieUZKWjVuRnZLUnFCeGNTWDJjYXVkWCSdGm1haWx0bzpn\n" +
    "bWFpbC5jb206a2l0dGVuYmlsbGlvbmFpcmVjZXhw9mNmY3SBoWVzcGFjZaFkbmFtZXBtZW93IG1l\n" +
    "b3cgdGVvICAgY2lzc1gi7QF6USS7Y+EDcffOy/SnhTLpycda+ZD39NU94WhxKZEFeWNwcmaAxwIB\n" +
    "cRIgy5lWvp3pWDMI6eCE6sjRlTT2ZXmXR0HA3ep+W47ZftGoYXNEgKADAGF2ZTAuOS4xY2F0dIGi\n" +
    "Y2NhbmEqZHdpdGhmdWNhbjoqY2F1ZFgi7QFBCIMVQYTFKzo4mgTHkJSH/c7XQpnoTcytwR9MBbrs\n" +
    "imNleHD2Y2ZjdIGibmFjY2Vzcy9jb25maXJt2CpYJQABcRIgH6zUmqTHgVyIICUZR4fHzlWWi1o+\n" +
    "jgaDflXpXeMcjfluYWNjZXNzL3JlcXVlc3TYKlglAAFxEiDug5dAaXMI/5TY6JkxUhuGKQ224seQ\n" +
    "z2WkXQnXsvtwUmNpc3NYJJ0abWFpbHRvOmdtYWlsLmNvbTpraXR0ZW5iaWxsaW9uYWlyZWNwcmaB\n" +
    "2CpYJQABcRIgqQQTX6+nM7XCaVt555NeAvMmSX6IlRYdlACRt2fkwIe/AgFxEiCpBBNfr6cztcJp\n" +
    "W3nnk14C8yZJfoiVFh2UAJG3Z+TAh6hhc1hE7aEDQOcxDTC2D3BYTqa07AIYNLaKYV/2LEGh2BlI\n" +
    "OkCFDqsL/kevgreaNCHffV26+N1g/hPJVXDFFVqwPS6NV/p7JQ1hdmUwLjkuMWNhdHSBomNjYW5h\n" +
    "KmR3aXRoeDhkaWQ6a2V5Ono2TWtuZ2pZa25ZVXdXSGJ0Y1oxUkpoa3BVRzhoa2J5RkpaNW5GdktS\n" +
    "cUJ4Y1NYMmNhdWRYJJ0abWFpbHRvOmdtYWlsLmNvbTpraXR0ZW5iaWxsaW9uYWlyZWNleHD2Y2Zj\n" +
    "dIGhZXNwYWNloWRuYW1lcG1lb3cgbWVvdyB0ZW8gICBjaXNzWCLtAXpRJLtj4QNx987L9KeFMunJ\n" +
    "x1r5kPf01T3haHEpkQV5Y3ByZoDHAgFxEiDLmVa+nelYMwjp4ITqyNGVNPZleZdHQcDd6n5bjtl+\n" +
    "0ahhc0SAoAMAYXZlMC45LjFjYXR0gaJjY2FuYSpkd2l0aGZ1Y2FuOipjYXVkWCLtAUEIgxVBhMUr\n" +
    "OjiaBMeQlIf9ztdCmehNzK3BH0wFuuyKY2V4cPZjZmN0gaJuYWNjZXNzL2NvbmZpcm3YKlglAAFx\n" +
    "EiAfrNSapMeBXIggJRlHh8fOVZaLWj6OBoN+Veld4xyN+W5hY2Nlc3MvcmVxdWVzdNgqWCUAAXES\n" +
    "IO6Dl0Bpcwj/lNjomTFSG4YpDbbix5DPZaRdCdey+3BSY2lzc1gknRptYWlsdG86Z21haWwuY29t\n" +
    "OmtpdHRlbmJpbGxpb25haXJlY3ByZoHYKlglAAFxEiCpBBNfr6cztcJpW3nnk14C8yZJfoiVFh2U\n" +
    "AJG3Z+TAh78CAXESIKkEE1+vpzO1wmlbeeeTXgLzJkl+iJUWHZQAkbdn5MCHqGFzWETtoQNA5zEN\n" +
    "MLYPcFhOprTsAhg0tophX/YsQaHYGUg6QIUOqwv+R6+Ct5o0Id99Xbr43WD+E8lVcMUVWrA9Lo1X\n" +
    "+nslDWF2ZTAuOS4xY2F0dIGiY2NhbmEqZHdpdGh4OGRpZDprZXk6ejZNa25nallrbllVd1dIYnRj\n" +
    "WjFSSmhrcFVHOGhrYnlGSlo1bkZ2S1JxQnhjU1gyY2F1ZFgknRptYWlsdG86Z21haWwuY29tOmtp\n" +
    "dHRlbmJpbGxpb25haXJlY2V4cPZjZmN0gaFlc3BhY2WhZG5hbWVwbWVvdyBtZW93IHRlbyAgIGNp\n" +
    "c3NYIu0BelEku2PhA3H3zsv0p4Uy6cnHWvmQ9/TVPeFocSmRBXljcHJmgMcCAXESIMuZVr6d6Vgz\n" +
    "COnghOrI0ZU09mV5l0dBwN3qfluO2X7RqGFzRICgAwBhdmUwLjkuMWNhdHSBomNjYW5hKmR3aXRo\n" +
    "ZnVjYW46KmNhdWRYIu0BQQiDFUGExSs6OJoEx5CUh/3O10KZ6E3MrcEfTAW67IpjZXhw9mNmY3SB\n" +
    "om5hY2Nlc3MvY29uZmlybdgqWCUAAXESIB+s1Jqkx4FciCAlGUeHx85VlotaPo4Gg35V6V3jHI35\n" +
    "bmFjY2Vzcy9yZXF1ZXN02CpYJQABcRIg7oOXQGlzCP+U2OiZMVIbhikNtuLHkM9lpF0J17L7cFJj\n" +
    "aXNzWCSdGm1haWx0bzpnbWFpbC5jb206a2l0dGVuYmlsbGlvbmFpcmVjcHJmgdgqWCUAAXESIKkE\n" +
    "E1+vpzO1wmlbeeeTXgLzJkl+iJUWHZQAkbdn5MCHvwIBcRIgqQQTX6+nM7XCaVt555NeAvMmSX6I\n" +
    "lRYdlACRt2fkwIeoYXNYRO2hA0DnMQ0wtg9wWE6mtOwCGDS2imFf9ixBodgZSDpAhQ6rC/5Hr4K3\n" +
    "mjQh331duvjdYP4TyVVwxRVasD0ujVf6eyUNYXZlMC45LjFjYXR0gaJjY2FuYSpkd2l0aHg4ZGlk\n" +
    "OmtleTp6Nk1rbmdqWWtuWVV3V0hidGNaMVJKaGtwVUc4aGtieUZKWjVuRnZLUnFCeGNTWDJjYXVk\n" +
    "WCSdGm1haWx0bzpnbWFpbC5jb206a2l0dGVuYmlsbGlvbmFpcmVjZXhw9mNmY3SBoWVzcGFjZaFk\n" +
    "bmFtZXBtZW93IG1lb3cgdGVvICAgY2lzc1gi7QF6USS7Y+EDcffOy/SnhTLpycda+ZD39NU94Whx\n" +
    "KZEFeWNwcmaAxwIBcRIgy5lWvp3pWDMI6eCE6sjRlTT2ZXmXR0HA3ep+W47ZftGoYXNEgKADAGF2\n" +
    "ZTAuOS4xY2F0dIGiY2NhbmEqZHdpdGhmdWNhbjoqY2F1ZFgi7QFBCIMVQYTFKzo4mgTHkJSH/c7X\n" +
    "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\n" +
    "mVa+nelYMwjp4ITqyNGVNPZleZdHQcDd6n5bjtl+0WNjYW5rdWNhbi9hdHRlc3Rkd2l0aHRkaWQ6\n" +
    "d2ViOndlYjMuc3RvcmFnZWNhdWRYIu0BQQiDFUGExSs6OJoEx5CUh/3O10KZ6E3MrcEfTAW67Ipj\n" +
    "ZXhw9mNmY3SBom5hY2Nlc3MvY29uZmlybdgqWCUAAXESIB+s1Jqkx4FciCAlGUeHx85VlotaPo4G\n" +
    "g35V6V3jHI35bmFjY2Vzcy9yZXF1ZXN02CpYJQABcRIg7oOXQGlzCP+U2OiZMVIbhikNtuLHkM9l\n" +
    "pF0J17L7cFJjaXNzUp0ad2ViOndlYjMuc3RvcmFnZWNwcmaA/AYBcRIgDLWRQRo3roF5sZnZk4i4\n" +
    "MHMApTPA8uOiDSlVL/DlvKCoYXNYRO2hA0BYe7/uWF38ILxlIWRyiTCqEsFTVuPkX0mZJ/3IefdD\n" +
    "Ek0pibwcoI27M1c9c4kdrmOd9T6wNjYsuoZgXhl3FuMCYXZlMC45LjFjYXR0hKJjY2FuaGJsb2Iv\n" +
    "YWRkZHdpdGh4OGRpZDprZXk6ejZNa25nallrbllVd1dIYnRjWjFSSmhrcFVHOGhrYnlGSlo1bkZ2\n" +
    "S1JxQnhjU1gyomNjYW5paW5kZXgvYWRkZHdpdGh4OGRpZDprZXk6ejZNa25nallrbllVd1dIYnRj\n" +
    "WjFSSmhrcFVHOGhrYnlGSlo1bkZ2S1JxQnhjU1gyomNjYW5uZmlsZWNvaW4vb2ZmZXJkd2l0aHg4\n" +
    "ZGlkOmtleTp6Nk1rbmdqWWtuWVV3V0hidGNaMVJKaGtwVUc4aGtieUZKWjVuRnZLUnFCeGNTWDKi\n" +
    "Y2Nhbmp1cGxvYWQvYWRkZHdpdGh4OGRpZDprZXk6ejZNa25nallrbllVd1dIYnRjWjFSSmhrcFVH\n" +
    "OGhrYnlGSlo1bkZ2S1JxQnhjU1gyY2F1ZFgi7QE7kI/xAK/L3+dEZZ3BXbpsNsY2teh+MO/c/Uqe\n" +
    "2Zvz1mNleHD2Y2ZjdIGhZXNwYWNloWRuYW1lcG1lb3cgbWVvdyB0ZW8gICBjaXNzWCLtAUEIgxVB\n" +
    "hMUrOjiaBMeQlIf9ztdCmehNzK3BH0wFuuyKY3ByZojYKlglAAFxEiDLmVa+nelYMwjp4ITqyNGV\n" +
    "NPZleZdHQcDd6n5bjtl+0dgqWCUAAXESIMuZVr6d6VgzCOnghOrI0ZU09mV5l0dBwN3qfluO2X7R\n" +
    "2CpYJQABcRIgy5lWvp3pWDMI6eCE6sjRlTT2ZXmXR0HA3ep+W47ZftHYKlglAAFxEiDLmVa+nelY\n" +
    "Mwjp4ITqyNGVNPZleZdHQcDd6n5bjtl+0dgqWCUAAXESIKZh+q1vRGWttTTW80PYtRJ8+97OwSdv\n" +
    "eS79oUZvnuKw2CpYJQABcRIgpmH6rW9EZa21NNbzQ9i1Enz73s7BJ295Lv2hRm+e4rDYKlglAAFx\n" +
    "EiCmYfqtb0RlrbU01vND2LUSfPvezsEnb3ku/aFGb57isNgqWCUAAXESIKZh+q1vRGWttTTW80PY\n" +
    "tRJ8+97OwSdveS79oUZvnuKw";

/** @param {string} data Base64 encoded CAR file */
async function parseProof(data: string) {
    const blocks = [];
    const reader = await CarReader.fromBytes(Buffer.from(data, "base64"));
    for await (const block of reader.blocks()) {
        blocks.push(block);
    }
    // Thanks linter :)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return importDAG(blocks);
}


describe("w3", () => {
    let client: Client.Client;
    beforeAll(async () => {
        const principal = Signer.parse(KEY);
        const store = new StoreMemory();
        client = await Client.create({ principal, store });

        // now give Agent the delegation from the Space
        const proof = await parseProof(PROOF);
        const space = await client.addSpace(proof);
        console.log(space.did());
        await client.setCurrentSpace(space.did());
    });

    test("just some temporary shit I need to check fast", async () => {
        const jsonBlob = new Blob([JSON.stringify({ "shit": "yes", "object": "pants" })], { type: "application/json" });
        const fileCid = await client.uploadFile(new File([jsonBlob], `meow${Date.now() / 1000}.json`));
        console.log(`File CID ${fileCid}`);
    });
});
