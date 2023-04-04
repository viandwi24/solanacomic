import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import { WrapperConnection } from "./utils/wrapper-connection";
import path from "path";
import fs from "fs";

(async () => {
  const connection = new WrapperConnection(
    "https://rpc-devnet.helius.xyz/?api-key=deaec5f3-f4bb-4702-967c-48b9b7e5a951",
    { commitment: "confirmed" }
  );
  const ownerAddress = "FVYbp7ZHXN7YwDYM6uAfhkfgqGna5aFrYLRA9EMnWELL";
  try {
    console.log("connection:", connection.rpcEndpoint);
    console.log("ownerAddress:", ownerAddress);
    const data = await connection.getAssetsByOwner({
      ownerAddress,
    });

    // path
    const jsonPath = path.join(__dirname, `./${ownerAddress}-assets.json`);
    // save to json file
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
})();
