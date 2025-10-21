import Decimal from 'decimal.js';
import { useCallback, useEffect, useRef } from 'react';
import { useArkDAO } from '../providers/arkdao-data.provider';
import { useAuth } from '../providers/auth-provider';
import { useRedeemableCapitalCache } from '../providers/claimable-capital-cache.provider';
import { BondingStatus, BondService } from '../services/BondService';
import { TransformedBondData } from '../types/bond';
import { TransformedMyStakingData } from '../types/stake';

// Asset types
export type AssetOperationType = 'bonding' | 'staking';

// Asset data union type
export type AssetOperationData<T extends AssetOperationType> =
  T extends 'bonding' ? TransformedBondData : TransformedMyStakingData;

// Asset-specific configuration
interface AssetOperationConfig<T extends AssetOperationType> {
  // Primary operations (capital/unstake)
  primaryOperation: {
    handler: (amount: Decimal, assetId: string) => Promise<any>;
    successStatusCode: any;
    actionButtonLabel: string;
    validateTransaction?: (tx: any) => boolean;
  };
  // Reward operations
  rewardOperation: {
    successStatusCode: any;
  };
  // Field mappings for cache operations
  claimableCapitalField: keyof AssetOperationData<T>;
}

export interface UseAssetOperationsProps<T extends AssetOperationType> {
  assetType: T;
  onTransactionSuccess?: () => void;
  onError?: () => void;
}

export function useAssetOperations<T extends AssetOperationType>({
  assetType,
  onTransactionSuccess,
}: UseAssetOperationsProps<T>) {
  const { user } = useAuth();
  const { withdrawLPBondingCapital, withdrawStaking } = useArkDAO();

  // Cache operations (global context)
  const {
    getCachedValue,
    setCachedValue,
    hasCachedValue,
    clearCacheEntry,
    setLoadingState,
    isLoading,
    getInflightRequest,
    setInflightRequest,
    hasInflightRequest,
  } = useRedeemableCapitalCache();

  // Track timeouts for cleanup to prevent memory leaks
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup timeout on unmount and track mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  // Asset-specific configurations
  const bondingConfig: AssetOperationConfig<'bonding'> = {
    primaryOperation: {
      handler: withdrawLPBondingCapital,
      successStatusCode: 'STATUS.SUCCESS.BONDING.withdrawn',
      actionButtonLabel: 'general.gotoMyAccount',
    },
    rewardOperation: {
      successStatusCode: 'STATUS.SUCCESS.BONDING.claimed',
    },
    claimableCapitalField: 'redeemable_capital' as keyof TransformedBondData,
  };

  const stakingConfig: AssetOperationConfig<'staking'> = {
    primaryOperation: {
      handler: withdrawStaking,
      successStatusCode: 'STATUS.SUCCESS.STAKING.unstaked',
      actionButtonLabel: 'general.gotoMyAccount',
    },
    rewardOperation: {
      successStatusCode: 'STATUS.SUCCESS.STAKING.claimed',
    },
    claimableCapitalField:
      'unstakable_capital' as keyof TransformedMyStakingData,
  };

  // Configuration registry
  const assetConfigs = {
    bonding: bondingConfig,
    staking: stakingConfig,
  } as const;

  // Get asset-specific configuration
  const config = assetConfigs[assetType] as AssetOperationConfig<T>;

  // Fetch claimable capital with unified logic for both asset types
  const fetchClaimableCapital = useCallback(
    async (assets: BondingStatus[]) => {
      const assetsNeedingFetch = assets.filter(
        (asset) => !hasCachedValue(asset.id) && !hasInflightRequest(asset.id),
      );

      if (assetsNeedingFetch.length === 0) {
        // Check if there are inflight requests we should wait for
        const waitingAssets = assets.filter((asset) =>
          hasInflightRequest(asset.id),
        );
        if (waitingAssets.length > 0) {
          // Wait for existing requests to complete
          await Promise.allSettled(
            waitingAssets.map((asset) => getInflightRequest(asset.id)),
          );
        }
        return; // All assets are cached or being fetched
      }

      const assetIds = assetsNeedingFetch.map((asset) => asset.id);

      // Set loading state for assets we're fetching
      assetIds.forEach((assetId) => setLoadingState(assetId, true));

      // Create operation using regular async/await with error handling
      const operationPromise = (async () => {
        try {
          const results =
            await BondService.getClaimablePrincipalForBonds(assetIds);
          return results;
        } catch (error) {
          // Log error through unified system but don't show UI (this is background fetching)
          console.error(
            `Failed to fetch claimable capital for ${assetType}:`,
            error,
          );
          throw error;
        }
      })();

      // Register in-flight requests for deduplication
      assetIds.forEach((assetId) =>
        setInflightRequest(assetId, operationPromise),
      );

      try {
        const results = await operationPromise;
        // Cache the results
        results.forEach((fetchResult: any) => {
          setCachedValue(
            fetchResult.bondId,
            fetchResult.claimableAmount,
            fetchResult.error,
          );
        });
      } catch {
        // Set error state for failed assets
        assetIds.forEach((assetId) => {
          setCachedValue(assetId, '0', 'Failed to load');
        });
      }

      // Always clear loading state
      assetIds.forEach((assetId) => setLoadingState(assetId, false));
    },
    [
      assetType,
      hasCachedValue,
      hasInflightRequest,
      getInflightRequest,
      setInflightRequest,
      setLoadingState,
      setCachedValue,
    ],
  );

  // Retry failed claimable capital fetches for specific assets
  const retryFailedFetches = useCallback(
    (assetIds: string[], data: BondingStatus[]) => {
      const assetsToRetry = data.filter((asset) => assetIds.includes(asset.id));
      // Clear error state before retrying
      assetIds.forEach((assetId) => clearCacheEntry(assetId));
      fetchClaimableCapital(assetsToRetry);
    },
    [clearCacheEntry, fetchClaimableCapital],
  );

  // Generic primary operation handler (redeem capital/unstake)
  const handlePrimaryOperation = async (
    amount: Decimal,
    assetId: string,
    setIsProcessing: (value: boolean) => void,
  ): Promise<boolean> => {
    if (!amount) {
      return false;
    }

    setIsProcessing(true);

    try {
      // execute handler
      await config.primaryOperation.handler(amount, assetId);

      // Clear cache and refresh data
      clearCacheEntry(assetId);
      // await refresh();

      if (onTransactionSuccess) {
        onTransactionSuccess();
      }

      setIsProcessing(false);
      return true;
    } catch (error) {
      // Error is already handled by withSDKErrorHandling
      setIsProcessing(false);
      throw error;
    }
  };

  return {
    // Core operations
    fetchClaimableCapital,
    retryFailedFetches,
    handlePrimaryOperation, // handleRedeemCapital or handleUnstake
    // Cache operations
    getCachedValue,
    isLoading,
    clearCacheEntry,

    // Utilities
    user,
    config,
  };
}
