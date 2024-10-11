import { getConfig } from "./config.ts";
import FormData from "form-data";
import http from "http";

/**
 * Upload a Buffer to IPFS using a raw HTTP request
 * @param {Buffer} buffer - The data buffer to be uploaded to IPFS
 * @returns {Promise<string>} - The CID of the uploaded data
 */
export async function uploadAndPinFileToIPFS(buffer: Buffer): Promise<string> {
    const form = new FormData();
    form.append("file", buffer, { contentType: "text/plain" });
    return new Promise((resolve, reject) => {
        const req = http.request(
            {
                method: "POST",
                host: getConfig().ipfs.host,
                port: getConfig().ipfs.port,
                path: "/api/v0/add",
                headers: form.getHeaders(),
            },
            (res) => {
                let data = "";
                res.on("data", (chunk) => data += chunk);

                res.on("end", () => {
                    try {
                        const jsonResponse = JSON.parse(data);
                        const cid = jsonResponse.Hash;
                        resolve(cid);
                    } catch (e) {
                        reject(`Failed to parse response: ${e}`);
                    }
                });
            });

        req.on("error", (err) => reject(`Request to ipfs failed with error: ${err.message}`));
        form.pipe(req);
    });
}