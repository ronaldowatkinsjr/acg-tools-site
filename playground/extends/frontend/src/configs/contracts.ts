import { Address } from 'viem';

/**
 * gARK Token Contract Configuration
 * Contract addresses for the gARK reward token across supported chains
 */
export const GARK_CONTRACT_ADDRESSES = {
  56: process.env.NEXT_PUBLIC_GARK_MAINNET_CONTRACT_ADDRESS as Address, // BSC Mainnet
  97: process.env.NEXT_PUBLIC_GARK_TESTNET_CONTRACT_ADDRESS as Address, // BSC Testnet
} as const;

/**
 * Get gARK contract address for current chain
 * @param chainId - The chain ID
 * @returns The gARK contract address for the chain, or null if not supported
 */
export function getGarkContractAddress(chainId: number): Address | null {
  return GARK_CONTRACT_ADDRESSES[chainId as keyof typeof GARK_CONTRACT_ADDRESSES] || null;
}

/**
 * Check if gARK contract is supported on the given chain
 * @param chainId - The chain ID to check
 * @returns True if gARK contract is deployed on this chain
 */
export function isGarkContractSupported(chainId: number): boolean {
  const address = getGarkContractAddress(chainId);
  return address !== null && address !== '0x0000000000000000000000000000000000000000';
}
