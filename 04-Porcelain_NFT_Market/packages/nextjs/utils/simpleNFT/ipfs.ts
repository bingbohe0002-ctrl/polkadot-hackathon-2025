import { create } from "kubo-rpc-client";

const pinataApiKey = "'a3dc96d6004b308e990a';";
const pinataSecretApiKey  = "'74ca3698bf6d974f330768dd956fbd7bf2922ddad65ae52bc430d424b5bd10e1';";

export const ipfsClient = create({
  host: "api.pinata.cloud",
  port: 443,
  protocol: "https",
  headers: {
    'pinata_api_key': pinataApiKey,
    'pinata_secret_api_key': pinataSecretApiKey
},
});

export async function getNFTMetadataFromIPFS(ipfsHash: string) {
  for await (const file of ipfsClient.get(ipfsHash)) {
    // The file is of type unit8array so we need to convert it to string
    const content = new TextDecoder().decode(file);
    // Remove any leading/trailing whitespace
    const trimmedContent = content.trim();
    // Find the start and end index of the JSON object
    const startIndex = trimmedContent.indexOf("{");
    const endIndex = trimmedContent.lastIndexOf("}") + 1;
    // Extract the JSON object string
    const jsonObjectString = trimmedContent.slice(startIndex, endIndex);
    try {
      const jsonObject = JSON.parse(jsonObjectString);
      return jsonObject;
    } catch (error) {
      console.log("Error parsing JSON:", error);
      return undefined;
    }
  }
}
