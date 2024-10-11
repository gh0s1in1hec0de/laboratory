import { create } from "ipfs-http-client";
import { getConfig } from "./config.ts";

const ipfs = create({
    host: getConfig().ipfs.host,
    port: getConfig().ipfs.port,
    protocol: "http"
});

export async function uploadAndPinFileToIPFS(fileBuffer: Buffer): Promise<string> {
    const { path: cid } = await ipfs.add(fileBuffer);
    await ipfs.pin.add(cid);
    return cid;
}