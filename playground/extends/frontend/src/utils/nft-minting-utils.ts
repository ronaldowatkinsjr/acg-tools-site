/**
 * NFT minting utilities using unified status system
 * Migrated from legacy error-handling.ts Result pattern to standard async/await
 */
import { BondService } from '../services/BondService';
import { ArkSDK } from '@a42n-olympus/ark-dao-sdk';

/**
 * Handles NFT minting flow with proper error handling
 * Throws standard errors for unified status system to handle
 */
export async function handleNftMintingFlow(bondId: string, sdk: ArkSDK) {
  // Generate NFT signature
  const {
    signature: nftSignature,
    params: {
      signatureTimestamp,
      expiryTimestamp,
      votingPoint,
      mintDeadline,
      id,
    },
  } = await BondService.generateNftSignature(bondId);

  // Simulate NFT minting first to catch issues early
  await sdk.daoNft.mintBySigSimulateTx({
    signature: nftSignature as `0x${string}`,
    signatureTimestamp: Number(signatureTimestamp),
    expiryTimestamp: Number(expiryTimestamp),
    votingPoint: BigInt(votingPoint),
    mintDeadline: Number(mintDeadline),
    _data: id as `0x${string}`,
  });

  // Mint NFT using signature
  return await sdk.daoNft.mintBySig({
    signature: nftSignature as `0x${string}`,
    signatureTimestamp: Number(signatureTimestamp),
    expiryTimestamp: Number(expiryTimestamp),
    votingPoint: BigInt(votingPoint),
    mintDeadline: Number(mintDeadline),
    _data: id as `0x${string}`,
  });
}
