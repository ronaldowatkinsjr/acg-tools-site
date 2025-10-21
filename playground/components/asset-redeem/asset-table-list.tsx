import {
  Button,
  Chip,
  Pagination,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@lidofinance/lido-ui';
import Decimal from 'decimal.js';
import {
  AssetOperationType,
  useAssetOperations,
} from 'extends/frontend/src/hooks/use-asset-operations';
import { safeDecimalConversion } from 'extends/frontend/src/lib/decimal-utils';
import { formatCoinDisplay } from 'extends/frontend/src/lib/utils';
import { useAuth } from 'extends/frontend/src/providers/auth-provider';
import {
  BondingStatus,
  BondingType,
  BondService,
} from 'extends/frontend/src/services/BondService';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useWeb3 } from 'reef-knot/web3-react';
import { zeroAddress } from 'viem';
import { PartialTransformedBondData } from './types';

const transformToTableData = (
  assetType: AssetOperationType,
  bondingStatus: BondingStatus,
  getCachedValue: (bondId: string) => { value: string; error?: string } | null,
  isLoading: (bondId: string) => boolean,
): PartialTransformedBondData => {
  // Use Decimal.js for all financial calculations to preserve precision
  const totalCapitalDecimal = safeDecimalConversion(bondingStatus.principal, 0); // Total capital amount

  const cachedValue = getCachedValue(bondingStatus.id);
  const isLoadingClaimable = isLoading(bondingStatus.id);

  let redeemableCapitalValue: Decimal | null = null;
  let redeemableCapitalError: string | null = null;

  if (cachedValue) {
    // Convert cached string value to Decimal for precise calculations
    redeemableCapitalValue = safeDecimalConversion(cachedValue.value, 0);
    redeemableCapitalError = cachedValue.error || null;
  }

  return {
    id: bondingStatus.id,
    title:
      assetType == 'bonding'
        ? 'ARK-USDT LP'
        : assetType == 'staking'
          ? 'Staked ARK'
          : '',
    period: bondingStatus.periodInDays,
    capital: totalCapitalDecimal,
    redeemable_capital: {
      value: redeemableCapitalValue,
      isLoading: isLoadingClaimable,
      error: redeemableCapitalError,
    },
  };
};

export function AssetTableList({
  assetType,
  refreshTrigger,
  onSelectAssetToRedeem,
  onTransformedDataUpdated,
}: {
  assetType: AssetOperationType;
  refreshTrigger?: number;
  // handle redeem operation in the parent component
  onSelectAssetToRedeem: (
    bondId: string,
    bondData: PartialTransformedBondData,
  ) => Promise<void>;
  onTransformedDataUpdated?: (data: PartialTransformedBondData[]) => void;
}) {
  const { account = zeroAddress } = useWeb3();
  const { user } = useAuth();

  const [data, setData] = useState<{
    data: BondingStatus[];
    meta: {
      page: number;
      take: number;
      itemCount: number;
      pageCount: number;
      hasPreviousPage: boolean;
      hasNextPage: boolean;
    };
  }>();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);

  // fetch master data
  const fetchMasterData = useCallback(async () => {
    // FIXME: for no reason, the condition didnt work when disconnecting wallet
    if (!user) {
      // Return empty data structure when no user is logged in
      return {
        data: [],
        meta: {
          page: currentPage,
          take: 5,
          itemCount: 0,
          pageCount: 0,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      };
    }

    try {
      // fetch master data
      const result = await BondService.getBondingStatusList({
        page: currentPage,
        take: 5,
        userId: user.id,
        type:
          assetType == 'bonding'
            ? BondingType.LP_BONDING
            : BondingType.ARK_STAKING,
      });

      // set page count
      setPageCount(result.meta.pageCount);

      return result;
    } catch (error) {
      console.warn('bondData fetch failed:', error);
    }
  }, [account, currentPage, user]);

  // fetch bond data on component mount
  useEffect(() => {
    fetchMasterData().then((resp) => {
      // update local bond data
      setData(resp);
    });
  }, [fetchMasterData]);

  // fetch bond data on refresh trigger
  useEffect(() => {
    fetchMasterData().then((resp) => {
      // update local bond data
      setData(resp);

      // update page count
      setPageCount(resp ? resp.meta.pageCount : 1);
    });
  }, [refreshTrigger]);

  // claimable asset refresh & redeem handler by BE & SC altogether
  const {
    fetchClaimableCapital: fetchClaimableAsset,
    getCachedValue,
    isLoading,
  } = useAssetOperations({
    assetType,
  });

  // update claimable capital on component mount
  useEffect(() => {
    if (data && data.data.length > 0) {
      fetchClaimableAsset(data.data);
    }
  }, [data, fetchClaimableAsset]);

  // update claimable capital on refresh
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0 && data && data.data.length > 0) {
      fetchClaimableAsset(data.data);
    }
  }, [refreshTrigger, data, fetchClaimableAsset]);

  //  format data for table display
  const transformedData = useMemo(() => {
    if (!data) {
      return [];
    }

    // parse
    const transformedData = data.data.map((item) => {
      const transformed = transformToTableData(
        assetType,
        item,
        getCachedValue,
        isLoading,
      );
      return {
        ...transformed,
      };
    });

    // trigger update callback
    if (onTransformedDataUpdated) {
      onTransformedDataUpdated(transformedData);
    }

    return transformedData;
  }, [data, getCachedValue, isLoading]);

  return (
    <>
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <Table width={'100%'}>
          <Thead sticky>
            <Tr>
              <Th></Th>
              <Th align="left">Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {!user || account == zeroAddress ? (
              <Tr>
                <Td></Td>
                <Td>Connect wallet to view data</Td>
              </Tr>
            ) : transformedData.length == 0 ? (
              <Tr>
                <Td></Td>
                <Td>No data found</Td>
              </Tr>
            ) : (
              transformedData.map((_data, i) => (
                <Tr key={`data-${assetType}-${i}-tr`}>
                  <Td align="left">
                    <span style={{ marginRight: '20px' }}>{_data.title}</span>
                    <Chip variant="warning">{_data.period}</Chip>
                  </Td>
                  <Td align="left">
                    <div>
                      <Button
                        size="xs"
                        variant="translucent"
                        onClick={() => onSelectAssetToRedeem(_data.id, _data)}
                      >
                        Select
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </div>
      <div style={{ marginTop: 10 }}>
        <Pagination
          onItemClick={(index) => {
            setCurrentPage(index);
          }}
          pagesCount={pageCount}
          activePage={currentPage}
        />
      </div>
    </>
  );
}
