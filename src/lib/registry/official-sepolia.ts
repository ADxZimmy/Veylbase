import type { Address } from "viem";
import { SEPOLIA_CHAIN, ZAMA_PROTOCOL_APPS_SEPOLIA_URL } from "@/lib/chains";
import type { MintMode, RegistryPair } from "@/lib/registry/types";

const PUBLIC_MINT_LIMIT = "1000000";

interface OfficialPairDefinition {
  assetKey: string;
  confidentialName: string;
  confidentialSymbol: string;
  confidentialAddress: Address;
  underlyingSymbol: string;
  underlyingName: string;
  underlyingAddress: Address;
  mintMode: MintMode;
  mock: boolean;
}

const officialPairDefinitions = [
  {
    assetKey: "USDC",
    confidentialName: "Confidential USDC (Mock)",
    confidentialSymbol: "cUSDCMock",
    confidentialAddress: "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639",
    underlyingSymbol: "USDCMock",
    underlyingName: "USDC Mock",
    underlyingAddress: "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF",
    mintMode: "public",
    mock: true
  },
  {
    assetKey: "USDT",
    confidentialName: "Confidential USDT (Mock)",
    confidentialSymbol: "cUSDTMock",
    confidentialAddress: "0x4E7B06D78965594eB5EF5414c357ca21E1554491",
    underlyingSymbol: "USDTMock",
    underlyingName: "USDT Mock",
    underlyingAddress: "0xa7dA08FafDC9097Cc0E7D4f113A61e31d7e8e9b0",
    mintMode: "public",
    mock: true
  },
  {
    assetKey: "WETH",
    confidentialName: "Confidential WETH (Mock)",
    confidentialSymbol: "cWETHMock",
    confidentialAddress: "0x46208622DA27d91db4f0393733C8BA082ed83158",
    underlyingSymbol: "WETHMock",
    underlyingName: "WETH Mock",
    underlyingAddress: "0xff54739b16576FA5402F211D0b938469Ab9A5f3F",
    mintMode: "public",
    mock: true
  },
  {
    assetKey: "BRON",
    confidentialName: "Confidential BRON (Mock)",
    confidentialSymbol: "cBRONMock",
    confidentialAddress: "0xaa5612FA27c927a0c7961f5AEFEE5ba3A0F9C891",
    underlyingSymbol: "BRONMock",
    underlyingName: "BRON Mock",
    underlyingAddress: "0xFf021fB13cA64e5354c62c954b949a88cfDEb25E",
    mintMode: "public",
    mock: true
  },
  {
    assetKey: "ZAMA",
    confidentialName: "Confidential ZAMA (Mock)",
    confidentialSymbol: "cZAMAMock",
    confidentialAddress: "0xf2D628d2598aF4eAF94CB76a437Ff86CA78FfbFB",
    underlyingSymbol: "ZAMAMock",
    underlyingName: "ZAMA Mock",
    underlyingAddress: "0x75355a85c6FB9df5f0C80FF54e8747EEe9a0BF57",
    mintMode: "public",
    mock: true
  },
  {
    assetKey: "tGBP",
    confidentialName: "Confidential tGBP (Mock)",
    confidentialSymbol: "ctGBPMock",
    confidentialAddress: "0xfCE5c7069c5525eF6c8C2b2E35A745bA20a2F7CC",
    underlyingSymbol: "tGBPMock",
    underlyingName: "tGBP Mock",
    underlyingAddress: "0x93c931278A2aad1916783F952f94276eA5111442",
    mintMode: "public",
    mock: true
  },
  {
    assetKey: "XAUt",
    confidentialName: "Confidential XAUt (Mock)",
    confidentialSymbol: "cXAUtMock",
    confidentialAddress: "0xe4FcF848739845BC81Dee1d5352cf3844F0a60C7",
    underlyingSymbol: "XAUtMock",
    underlyingName: "XAUt Mock",
    underlyingAddress: "0x24377AE4AA0C45ecEe71225007f17c5D423dd940",
    mintMode: "public",
    mock: true
  },
  {
    assetKey: "tGBP",
    confidentialName: "Confidential tGBP",
    confidentialSymbol: "ctGBP",
    confidentialAddress: "0x167DC962808B32CFFFc7e14B5018c0bE06A3A208",
    underlyingSymbol: "tGBP",
    underlyingName: "tGBP",
    underlyingAddress: "0xf6Ef9ADB61A48E29E36bc873070A46A3D2667ff3",
    mintMode: "restricted",
    mock: false
  }
] satisfies OfficialPairDefinition[];

function toPair(definition: OfficialPairDefinition): RegistryPair {
  const id = `${definition.assetKey.toLowerCase()}-${
    definition.mock ? "mock" : "official"
  }-sepolia`;

  return {
    id,
    chainId: SEPOLIA_CHAIN.chainId,
    network: "sepolia",
    registryAddress: SEPOLIA_CHAIN.registryAddress,
    source: "official-zama-protocol-apps",
    sourceUrl: ZAMA_PROTOCOL_APPS_SEPOLIA_URL,
    official: true,
    valid: true,
    mock: definition.mock,
    assetKey: definition.assetKey,
    underlying: {
      address: definition.underlyingAddress,
      name: definition.underlyingName,
      symbol: definition.underlyingSymbol,
      decimals: null,
      standard: "ERC20",
      mint: {
        mode: definition.mintMode,
        perCallLimitTokens:
          definition.mintMode === "public" ? PUBLIC_MINT_LIMIT : undefined,
        note:
          definition.mintMode === "public"
            ? "Public mint(address,uint256), limited to 1,000,000 tokens per call by the official Zama Sepolia address docs."
            : "Restricted minting in the official Zama Sepolia address docs."
      }
    },
    confidential: {
      address: definition.confidentialAddress,
      name: definition.confidentialName,
      symbol: definition.confidentialSymbol,
      decimals: null,
      standard: "ERC7984",
      wrapper: true
    },
    capabilities: {
      faucet: definition.mintMode === "public",
      wrap: true,
      unwrap: true,
      decrypt: true,
      transfer: true
    },
    notes:
      definition.assetKey === "ZAMA" && definition.mock
        ? [
            "This ZAMA mock underlying is only for testing and is not the real Sepolia ZAMA token."
          ]
        : []
  };
}

export const OFFICIAL_SEPOLIA_PAIRS = officialPairDefinitions.map(toPair);
