import type { TokenInfo } from "../types";

export const SUPPORTED_TOKENS: TokenInfo[] = [
  { symbol: "USDC", name: "USD Coin", chain: "NEAR", rate: 1.0, color: "#2775CA", icon: "usdc" },
  { symbol: "USDN", name: "NEAR Dollar", chain: "NEAR", rate: 1.0, color: "#00C08B", icon: "usdn" },
  { symbol: "NEAR", name: "NEAR Protocol", chain: "NEAR", rate: 0.155, color: "#000000", icon: "near" },
  { symbol: "ETH", name: "Ethereum", chain: "Ethereum", rate: 0.000285, color: "#627EEA", icon: "eth" },
  { symbol: "BTC", name: "Bitcoin", chain: "Bitcoin", rate: 0.0000105, color: "#F7931A", icon: "btc" },
];

export function formatTokenAmount(usdAmount: number, tokenSymbol: string): string {
  const token = SUPPORTED_TOKENS.find((t) => t.symbol === tokenSymbol);
  if (!token) return usdAmount.toFixed(2);
  const amount = usdAmount * token.rate;
  if (amount < 0.001) return amount.toFixed(8);
  if (amount < 1) return amount.toFixed(6);
  if (amount < 100) return amount.toFixed(4);
  return amount.toFixed(2);
}

const BASE58_CHARS = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function generateTxHash(): string {
  let hash = "";
  for (let i = 0; i < 44; i++) {
    hash += BASE58_CHARS[Math.floor(Math.random() * BASE58_CHARS.length)];
  }
  return hash;
}

export function simulatePaymentDelay(): Promise<void> {
  const ms = 2000 + Math.random() * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const NEAR_EXPLORER_BASE = "https://testnet.nearblocks.io/txns/";

export function getExplorerUrl(txHash: string): string {
  return `${NEAR_EXPLORER_BASE}${txHash}`;
}

export function truncateHash(hash: string): string {
  if (hash.length <= 10) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}
