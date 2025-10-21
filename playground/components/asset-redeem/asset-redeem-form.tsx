import { ERROR_CODE, SDKError } from '@a42n-olympus/ark-dao-sdk';
import { Input, toast } from '@lidofinance/lido-ui';
import { Action } from 'components/action';
import TokenInput, { DEFAULT_VALUE, ValueType } from 'components/tokenInput';
import { AssetOperationType } from 'extends/frontend/src/hooks/use-asset-operations';
import { useAuth } from 'extends/frontend/src/providers/auth-provider';
import { useRedeemableCapitalCache } from 'extends/frontend/src/providers/claimable-capital-cache.provider';
import { handleNftMintingFlow } from 'extends/frontend/src/utils/nft-minting-utils';
import { useArkSDK } from 'providers/sdk';
import { useState } from 'react';
import { PartialTransformedBondData } from './types';

export type AssetRedeemFormSelectAssetData = {
  bondId: string;
  bondData: PartialTransformedBondData;
  requireClaimDAONft?: boolean; // false if not defined
};

export function AssetRedeemForm({
  assetType,
  onSubmitRedeem,
  selectedAsset,
  onClearAsset,
  onAssetTableRefresh,
  onSuccessClaimDAONft,
}: {
  assetType: AssetOperationType;
  onSubmitRedeem: (redeemAmount: bigint, assetId: string) => Promise<any>;
  selectedAsset: AssetRedeemFormSelectAssetData | undefined;
  onClearAsset: () => void;
  onAssetTableRefresh: () => Promise<void>;
  onSuccessClaimDAONft: (bondId: string) => Promise<void>;
}) {
  const [redeemAmount, setRedeemAmount] = useState<ValueType>(DEFAULT_VALUE);
  const { user } = useAuth();
  const sdk = useArkSDK();
  const { clearCacheEntry } = useRedeemableCapitalCache();

  return selectedAsset != undefined ? (
    <>
      <Action
        title={assetType == 'bonding' ? 'Redeem Bond' : 'Redeem Stake'}
        action={async () => {
          // ensure an asset is selected
          if (!selectedAsset) {
            throw new SDKError({
              code: ERROR_CODE.INVALID_ARGUMENT,
              error: 'Asset must be selected',
              message: 'Asset must be selected to perform redeem',
            });
          }

          // validate redeem amount
          if (!redeemAmount || redeemAmount == BigInt(0)) {
            throw new SDKError({
              code: ERROR_CODE.INVALID_ARGUMENT,
              error: 'Redeem must have value',
              message: 'Redeem must have value to perform redeem',
            });
          }

          try {
            // clear redeemable capital cache for current asset
            clearCacheEntry(selectedAsset.bondId);

            // execute redeem
            const result = await onSubmitRedeem(
              redeemAmount,
              selectedAsset.bondId,
            );

            // refresh table
            onAssetTableRefresh();

            return {
              result,
            };
          } catch (error) {
            // refresh table even though tx failed
            onAssetTableRefresh();

            // throw error
            throw new SDKError({
              error: error,
              message: (error as Error).message,
            });
          }
        }}
        walletAction
        disableAction={!!!user}
      >
        <Input
          label="Bond Type"
          value={selectedAsset.bondData.title}
          disabled
        />
        <Input
          label="Bond's Vesting Period"
          value={`${selectedAsset.bondData.period} days`}
          disabled
        />
        <TokenInput
          label="Amount to redeem"
          value={redeemAmount}
          placeholder="0.0"
          onChange={setRedeemAmount}
        />
      </Action>
      {selectedAsset.requireClaimDAONft != undefined &&
        selectedAsset.requireClaimDAONft && (
          <Action
            title="Claim DAO Nft"
            action={async () => {
              // claim nft
              await handleNftMintingFlow(selectedAsset.bondId, sdk);

              // notify successful tx
              toast('DAO Nft claimed', {
                type: 'success',
              });

              // update asset nft status
              onSuccessClaimDAONft(selectedAsset.bondId);
            }}
            walletAction
            disableAction={!!!user}
            buttonColor="warning"
          />
        )}
      <Action
        title="Reset Selected Asset"
        action={onClearAsset}
        walletAction
        disableAction={!!!user}
      />
    </>
  ) : (
    <></>
  );
}
