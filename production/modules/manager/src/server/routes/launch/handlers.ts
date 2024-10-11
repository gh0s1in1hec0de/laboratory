import type { JettonMetadata } from "starton-periphery";
import { uploadAndPinFileToIPFS } from "../../../ipfs";
import * as db from "../../../db";

export async function uploadMetadataToIpfs(
    { links, metadata, image }: {
        links: { x?: string, telegram?: string, website?: string },
        metadata: JettonMetadata,
        image: string,
    }
): Promise<string> {
    const imageCID = await uploadAndPinFileToIPFS(Buffer.from(image));
    metadata.image = `https://ipfs.io/ipfs/${imageCID}`;

    const metadataJsonCID = await uploadAndPinFileToIPFS(
        Buffer.from(JSON.stringify(metadata))
    );
    await db.createLaunchMetadata({
        onchainMetadataLink: `https://ipfs.io/ipfs/${metadataJsonCID}`,
        xLink: links.x,
        telegramLink: links.telegram,
        website: links.website,
    });
    return metadataJsonCID;
}
