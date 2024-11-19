import type { BuyWhitelistRequest, UploadMetadataToIpfsRequest } from "starton-periphery";
import { uploadAndPinFileToIPFS } from "../../../ipfs";
import * as db from "../../../db";

export async function uploadMetadataToIpfs(
    { links, metadata, image, influencerSupport }: UploadMetadataToIpfsRequest
): Promise<string> {
    // return "Qmb4Yjspwz3gVq371wvVN9hqzzAoopzv5W1yS49qdTJJ7f";
    if (image) {
        const base64Image = image.split(",")[1];  // remove `data:image/...;base64,` if present
        const imageBuffer = Buffer.from(base64Image, "base64");

        const imageCID = await uploadAndPinFileToIPFS(imageBuffer);
        metadata.image = `https://ipfs.io/ipfs/${imageCID}`;
    }

    const metadataJsonCID = await uploadAndPinFileToIPFS(
        Buffer.from(JSON.stringify(metadata))
    );
    await db.storeLaunchMetadata({
        onchainMetadataLink: `https://ipfs.io/ipfs/${metadataJsonCID}`,
        xLink: links.x,
        telegramLink: links.telegram,
        website: links.website,
        influencerSupport: influencerSupport !== undefined ? influencerSupport : false
    });
    return metadataJsonCID;
}

export async function buyWhitelist(
    { callerAddress, launchAddress }: BuyWhitelistRequest
): Promise<void> {
    return await db.buyWhitelist(callerAddress, launchAddress);
}
