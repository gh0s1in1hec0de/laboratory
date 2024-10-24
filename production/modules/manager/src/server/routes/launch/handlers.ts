import type { BuyWhitelistRequest, UploadMetadataToIpfsRequest } from "starton-periphery";
import { uploadAndPinFileToIPFS } from "../../../ipfs";
import * as db from "../../../db";

export async function uploadMetadataToIpfs(
    { links, metadata, image, influencerSupport }: UploadMetadataToIpfsRequest
): Promise<string> {
    const base64Image = image.split(",")[1];  // remove `data:image/...;base64,` if present
    const imageBuffer = Buffer.from(base64Image, "base64");

    const imageCID = await uploadAndPinFileToIPFS(imageBuffer);
    metadata.image = `https://ipfs.io/ipfs/${imageCID}`;

    const metadataJsonCID = await uploadAndPinFileToIPFS(
        Buffer.from(JSON.stringify(metadata))
    );
    await db.storeLaunchMetadata({
        onchainMetadataLink: `https://ipfs.io/ipfs/${metadataJsonCID}`,
        xLink: links.x,
        telegramLink: links.telegram,
        website: links.website,
        influencerSupport
    });
    return metadataJsonCID;
}

export async function buyWhitelist({ userAddress, launchAddress }: BuyWhitelistRequest,): Promise<void> {
    return await db.buyWhitelist(userAddress, launchAddress);
}
