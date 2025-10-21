import ApiService, { PageDto, PageOptionsDto } from './ApiService';
import { API_CONFIG } from '../configs/appConfig';

// -----  Enums  -----
export enum BondingType {
  LP_BONDING = 'lp_bonding',
  ARK_STAKING = 'ark_staking',
}

export enum BondingTransactionType {
  LP_BOND = 'lp_bond',
  LP_UNBOND = 'lp_unbond',
  ARK_STAKE = 'ark_stake',
  ARK_UNSTAKE = 'ark_unstake',
  CLAIM_REWARD = 'claim_reward',
  ADMIN_CREATE = 'admin_create',
}

export enum BondingTransactionStatusType {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum BondingWithdrawalType {
  PRINCIPAL = 'principal',
  STATIC_REWARD = 'static_reward',
  DYNAMIC_REWARD = 'dynamic_reward',
  GARK_REWARD = 'gark_reward',
}

// -----  Interfaces  -----
export interface BondingStatus {
  id: string;
  type: BondingType;
  principalInUsdt: string;
  principal: string;
  reward: string;
  claimedPrincipal: string;
  claimedReward: string;
  disqualificationThreshold: string;
  periodInDays: number;
  expectedRebasingCount: number;
  currentRebasingCount: number;
  daoNftTokenId: number;
  daoNftVotingPoint: string;
  burntDaoNftVotingPoint: string;
  nftSignature: string | null;
  nftSignatureExpiredAt: Date | null;
  claimedAt?: Date | null;
  interestRate: string | null;
  discountRate: string;
  isRemain: boolean;
  userId: string;
  userAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  bondingTransaction: BondingTransaction[];
}

export interface BondingRebaseHistory {
  id: string;
  rebaseAt: Date;
  currentAsset: string;
  currentReward: string;
  bondingStatusId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BondingTransaction {
  id: string;
  amount: string;
  type: BondingTransactionType;
  status: BondingTransactionStatusType;
  comment: string | null;
  bondingStatusId?: string;
  bondingWithdrawalId?: string;
  createdAt: Date;
  updatedAt: Date;
  periodInDays: number;
}

export interface BondingWithdrawal {
  id: string;
  type: BondingWithdrawalType;
  timestamp: Date;
  amount: string;
  daoNftTokenId: number;
  burntDaoNftVotingPoint: string;
  params: Record<string, string>;
  signature: string;
  txHash: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BondRebasingConfig {
  id: string;
  modeId: number;
  interestRate: string;
  totalLpBondedArk: string;
  totalStakingArk: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BondConfig {
  id: string;
  disqualifyThresholdMultiplier: string;
  flexibleTermRebasingCountNeeded: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BondRewardWithdrawalConfig {
  id: string;
  unlockDays: number;
  burnRate: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// -----  Page Options  -----
export type BondingStatusPageOptions = {
  createdAtStart?: Date;
  createdAtEnd?: Date;
  type?: BondingType;
  periodInDays?: number;
  hasClaimed?: boolean;
  userAddress?: string;
  userId?: string;
} & PageOptionsDto;

export type BondingRebaseHistoryPageOptions = {
  bondingStatusId?: string;
  bondingType?: BondingType;
} & PageOptionsDto;

export type BondingTransactionPageOptions = {
  bondingType?: BondingType;
  type?: BondingTransactionType[];
  status?: BondingTransactionStatusType[];
  userId?: string;
  bondingStatusId?: string;
} & PageOptionsDto;

export type BondingWithdrawalPageOptions = {
  userId?: string;
} & PageOptionsDto;

export interface ClaimPrincipalParams {
  amount?: string;
}

export interface ClaimablePrincipalResponse {
  claimableAmount: string;
}

export interface LazyClaimablePrincipalResult {
  bondId: string;
  claimableAmount: string;
  error?: string;
}

export interface ClaimPrincipalResponse {
  data: {
    timestamp: string;
    claimAmount: string;
    user: string;
    id: string;
    nftDaoTokenId: string;
    nftDaoVotingPointsToBurn: string;
  };
  signature: string;
}

export interface ClaimRewardParams {
  amount?: string;
}

export interface ClaimRewardResponse {
  data: {
    user: string;
    amountToMint: string;
    timestamp: string;
    transactionId: string;
  };
  signature: string;
}

export interface RestakeParams {
  modeId: number;
  amount?: string;
}

export interface GenerateNftSignatureResponse {
  signature: string;
  params: {
    id: string;
    userAddress: string;
    votingPoint: string;
    expiryTimestamp: string;
    signatureTimestamp: string;
    mintDeadline: string;
  };
}

export interface DisqualificationResponse {
  usdtDisqualification: string;
  arkDisqualification: string;
}

export interface TVLParams {
  timeframe: 'hour' | 'day' | 'month';
}

export interface TVLResponse {
  bucket: string;
  tvl: string;
}

// -----  API functions  -----
export const BondService = {
  /**
   * Get TVL (Total Value Locked) data by timeframe
   */
  async getTVL(params: TVLParams): Promise<TVLResponse[]> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bonding/tvl',
      method: 'get',
      params,
    });
    return response.data;
  },

  /**
   * Get bonding status list with pagination
   */
  async getBondingStatusList(
    params?: BondingStatusPageOptions,
  ): Promise<PageDto<BondingStatus>> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bonding',
      method: 'get',
      params,
    });
    return response.data;
  },

  /**
   * Get claimable principal for specific bond IDs (lazy loading)
   */
  async getClaimablePrincipalForBonds(
    bondIds: string[],
  ): Promise<LazyClaimablePrincipalResult[]> {
    if (!bondIds || bondIds.length === 0) {
      return [];
    }

    const results = await Promise.all(
      bondIds.map(async (bondId) => {
        try {
          const claimableResponse =
            await BondService.getClaimablePrincipal(bondId);
          return {
            bondId,
            claimableAmount: claimableResponse.claimableAmount,
          };
        } catch (error) {
          console.warn(
            `Failed to fetch claimable principal for bond ${bondId}:`,
            error,
          );
          return {
            bondId,
            claimableAmount: '0',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }),
    );

    return results;
  },

  /**
   * Get bonding status detail by ID
   */
  async getBondingStatusDetail(id: string): Promise<BondingStatus> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + `bonding/${id}`,
      method: 'get',
    });
    return response.data;
  },

  /**
   * Get disqualification amounts for the current user
   */
  async getDisqualification(): Promise<DisqualificationResponse> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bonding/disqualification',
      method: 'get',
    });
    return response.data;
  },

  /**
   * Get bonding reward history with filtering options
   */
  async getBondingRewardHistory(
    params?: BondingRebaseHistoryPageOptions,
  ): Promise<PageDto<BondingRebaseHistory>> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bonding/reward-history',
      method: 'get',
      params,
    });
    return response.data;
  },

  /**
   * Get claimable principal
   */
  async getClaimablePrincipal(id: string): Promise<ClaimablePrincipalResponse> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + `bonding/claimable-principal/${id}`,
      method: 'get',
    });
    return response.data;
  },

  /**
   * Claim principal (partial or full)
   */
  async claimPrincipal(
    id: string,
    data?: ClaimPrincipalParams,
  ): Promise<ClaimPrincipalResponse> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + `bonding/claim-principal/${id}`,
      method: 'post',
      data,
    });
    return response.data;
  },

  /**
   * Generate NFT signature for DAO NFT minting
   */
  async generateNftSignature(
    id: string,
  ): Promise<GenerateNftSignatureResponse> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + `bonding/generate-nft-signature/${id}`,
      method: 'get',
    });
    return response.data;
  },

  /**
   * Claim reward
   */
  async claimReward(
    id: string,
    data?: ClaimRewardParams,
  ): Promise<ClaimRewardResponse> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + `bonding/claim-reward/${id}`,
      method: 'post',
      data,
    });
    return response.data;
  },

  /**
   * Get bonding transactions with pagination
   */
  async getBondingTransactions(
    params?: BondingTransactionPageOptions,
  ): Promise<PageDto<BondingTransaction>> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bonding-transaction',
      method: 'get',
      params,
    });
    return response.data;
  },

  /**
   * Get bonding withdrawals with pagination
   */
  async getBondingWithdrawals(
    params?: BondingWithdrawalPageOptions,
  ): Promise<PageDto<BondingWithdrawal>> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bonding-withdrawal',
      method: 'get',
      params,
    });
    return response.data;
  },

  /**
   * Get specific bonding withdrawal by ID
   */
  async getBondingWithdrawalById(id: string): Promise<BondingWithdrawal> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + `bonding-withdrawal/${id}`,
      method: 'get',
    });
    return response.data;
  },

  /**
   * Get bond rebasing configurations
   */
  async getBondRebasingConfigs(): Promise<BondRebasingConfig[]> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bond-rebasing-config',
      method: 'get',
    });
    return response.data;
  },

  /**
   * Get bond configuration
   */
  async getBondConfig(): Promise<BondConfig> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bond-config',
      method: 'get',
    });
    return response.data;
  },

  /**
   * Restake rewards
   * This will allow users to directly stake their claimable rewards
   */
  async restake(id: string, data: RestakeParams): Promise<BondingStatus> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + `bonding/restake/${id}`,
      method: 'post',
      data,
    });
    return response.data;
  },

  /**
   * Update isRemain flag for a bonding status
   */
  async updateIsRemain(id: string): Promise<BondingStatus> {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + `bonding/remain/${id}`,
      method: 'patch',
    });
    return response.data;
  },

  /**
   * Get bond reward withdrawal configurations
   */
  async getBondRewardWithdrawalConfigs(): Promise<
    BondRewardWithdrawalConfig[]
  > {
    const response = await ApiService.fetchData({
      url: API_CONFIG.API_PREFIX + 'bond-reward-withdrawal-config',
      method: 'get',
    });
    return response.data;
  },
};
