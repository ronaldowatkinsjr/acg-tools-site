import { Accordion } from '@lidofinance/lido-ui';
import { Action } from 'components/action';
import { ActionBlock } from 'components/action/styles';
import {
  AssetRedeemForm,
  AssetRedeemFormSelectAssetData,
} from 'components/asset-redeem/asset-redeem-form';
import { AssetTableList } from 'components/asset-redeem/asset-table-list';
import { toDecimal } from 'extends/frontend/src/lib/decimal-utils';
import { useArkDAO } from 'extends/frontend/src/providers/arkdao-data.provider';
import { useAuth } from 'extends/frontend/src/providers/auth-provider';
import { useArkSDK } from 'providers/sdk';
import { useState } from 'react';
import { formatEther } from 'viem';

export const StakeClaimDemo = ({
  wrapInSection,
}: {
  wrapInSection?: boolean;
}) => {
  const { withdrawStaking } = useArkDAO();
  const { stakeClaim, ark, views } = useArkSDK();

  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedAsset, setSelectedAsset] =
    useState<AssetRedeemFormSelectAssetData>();

  const body = (
    <>
      {/* claim stake */}
      <ActionBlock title="Redeem Stake">
        <AssetTableList
          assetType="staking"
          refreshTrigger={refreshTrigger}
          onSelectAssetToRedeem={async (bondId, bondData) =>
            setSelectedAsset({ bondId, bondData })
          }
          onTransformedDataUpdated={(updatedData) => {
            // update selected asset's data upon table refresh
            if (selectedAsset) {
              const updatedAsset = updatedData.find(
                ({ id }) =>
                  selectedAsset.bondId.toLowerCase() == id.toLowerCase(),
              );

              if (updatedAsset) {
                // NOTE: for pagination, going to another page will clear the selection
                // update asset with new data
                setSelectedAsset({
                  bondData: updatedAsset,
                  bondId: updatedAsset.id,
                });
              } else {
                // asset has to be fully claimed, therefore clear selected asset
                setSelectedAsset(undefined);
              }
            }
          }}
        />
      </ActionBlock>
      <AssetRedeemForm
        assetType="staking"
        onSubmitRedeem={async (redeemAmount, bondId) =>
          withdrawStaking(
            toDecimal(formatEther(redeemAmount)),
            bondId,
            async (bondId) => {
              if (selectedAsset && bondId == selectedAsset.bondId) {
                setSelectedAsset((current) => ({
                  ...current!,
                  requireClaimDAONft: true,
                }));
              }
            },
          )
        }
        selectedAsset={selectedAsset}
        onClearAsset={() => setSelectedAsset(undefined)}
        onAssetTableRefresh={async () => {
          // set 2 seconds interval before refreshing table with new data
          setTimeout(() => setRefreshTrigger((prev) => prev + 1), 2000);
        }}
        onSuccessClaimDAONft={async (bondId) => {
          if (selectedAsset && bondId == selectedAsset.bondId) {
            setSelectedAsset((current) => ({
              ...current!,
              requireClaimDAONft: false,
            }));
          }
        }}
      />
      <Action
        title="Refresh Data"
        action={() => setRefreshTrigger((prev) => prev + 1)}
        walletAction
        disableAction={!!!user}
      />
    </>
  );

  return wrapInSection && wrapInSection == true ? (
    <Accordion summary="Redeem Stake">{body}</Accordion>
  ) : (
    body
  );
};
