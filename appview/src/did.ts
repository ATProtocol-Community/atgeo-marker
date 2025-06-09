import { readFileSync } from "fs";

const pubKey =
  process.env.PUBLIC_KEY ?? readFileSync("./public_key.pem", "utf-8");

export const getDidManifest = ({
  did,
  serviceEndpoint,
}: {
  did: string;
  serviceEndpoint: string;
}) => {
  return {
    "@context": [
      "https://www.w3.org/ns/did/v1",
      "https://w3id.org/security/multikey/v1",
      "https://w3id.org/security/suites/secp256k1-2019/v1",
    ],
    id: did,
    verificationMethod: [
      {
        id: did + "#atproto",
        type: "Multikey",
        controller: did,
        publicKeyMultibase: pubKey,
      },
    ],
    service: [
      {
        id: "#geomarker_appview",
        type: "GeomarkerAppView",
        serviceEndpoint,
      },
    ],
  };
};
