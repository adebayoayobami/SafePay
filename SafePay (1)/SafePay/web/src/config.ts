export const CONTRACT_ADDRESS = "0xbf1a3213113c9d820976e9bc75c6219c9d996358" as const;
export const MEZO_CHAIN = {
  id: 31611,
  name: "Mezo Testnet",
  network: "mezo-testnet",
  nativeCurrency: { name: "BTC", symbol: "BTC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.test.mezo.org"] } },
  blockExplorers: { default: { name: "Mezo Explorer", url: "https://explorer.test.mezo.org" } },
} as const;
