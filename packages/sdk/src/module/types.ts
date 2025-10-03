import type {
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  ContractFunctionReturnType,
  Hex,
  JsonRpcAccount,
} from 'viem';
import { CommonTransactionProps } from '../core/types.js';
import { ARK } from './abi/ARK.js';
import { ARKCoreGlobalConfig } from './abi/ARKCoreGlobalConfig.js';
import { GenesisNode } from './abi/GenesisNode.js';
import { LPBonding } from './abi/LPBonding.js';
import { RewardVesting } from './abi/RewardVesting.js';

//// deposit

export type BondDepositProps = CommonTransactionProps &
  BondDepositEncodeDataProps;

export type BondDepositInnerProps = Omit<CommonTransactionProps, 'account'> &
  BondDepositEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type BondDepositEncodeDataProps = {
  depositValue: bigint;
  modeId: bigint;
} & Partial<BondDepositPancakeswapParams>;

export type BondDepositPancakeswapParams = {
  deadline: number;
};

export type DAONftHintParams = {
  lpLockerTokenId: bigint;
  lpTokenId: bigint;
};

//// redeem

export type BondRedeemProps = CommonTransactionProps & {
  redeemBondAmount: bigint;
  signature: Hex;
  signatureTimestamp: bigint;
  _data?: string;
  nfDaoTokenId: bigint;
  nftDaoVotingPointsToBurn: bigint;
};

export type BondRedeemInnerProps = Omit<CommonTransactionProps, 'account'> &
  BondRedeemEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type BondRedeemEncodeDataProps = {
  redeemBondAmount: bigint;
  signature: Hex;
  signatureTimestamp: bigint;
  _data: string;
  nfDaoTokenId: bigint;
  nftDaoVotingPointsToBurn: bigint;
};

export type BondRedeemPancakeswapParams = {
  quoteAmountOut: bigint;
  deadline: number;
};

//// views

export type GetBondMode = ContractFunctionReturnType<
  typeof LPBonding,
  'view',
  'getMode'
> & {
  modeId: bigint;
  vestingPeriodInDays: number;
  discountRate_formatted: number;
  interestRate_formatted: number;
};

export type GetReleaseInfoFromRewardVesting = ContractFunctionReturnType<
  typeof RewardVesting,
  'view',
  'getRewardVesting'
>[number] & {
  isFullyClaimed: boolean;
  vestingEndDateTimestamp: number;
  modeId: number;
};

//// deposit

export type StakeDepositProps = CommonTransactionProps &
  StakeDepositEncodeDataProps;

export type StakeDepositInnerProps = Omit<CommonTransactionProps, 'account'> &
  StakeDepositEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type StakeDepositEncodeDataProps = {
  stakeValue: bigint;
  modeId: bigint;
};

//// redeem

export type StakeClaimProps = CommonTransactionProps &
  (Omit<StakeClaimEncodeDataProps, '_data'> & { _data?: string });

export type StakeClaimInnerProps = Omit<CommonTransactionProps, 'account'> &
  StakeClaimEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type StakeClaimEncodeDataProps = {
  claimAmount: bigint;
  signature: Hex;
  signatureTimestamp: bigint;
  nfDaoTokenId: bigint;
  nftDaoVotingPointsToBurn: bigint;
  _data: string;
};

// reward vesting register

export type RewardVestingRegisterProps = CommonTransactionProps &
  RewardVestingRegisterRequiredParams & {
    _data?: string;
  } & Partial<RewardVestingPancakeswapParams>;

export type RewardVestingRegisterInnerProps = Omit<
  CommonTransactionProps,
  'account'
> &
  RewardVestingRegisterEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type RewardVestingRegisterRequiredParams = {
  claimAmount: bigint;
  burnAmount: bigint;
  vestingPeriod: number;
  timestamp: number;
  rewardType: RewardVestingRegisterType;
  signature: Hex;
};

export type RewardVestingRegisterEncodeDataProps =
  RewardVestingRegisterRequiredParams & {
    _data: string;
  } & RewardVestingPancakeswapParams;

export enum RewardVestingRegisterType {
  STATIC,
  DYNAMIC,
}

export type DelayedRewardInfo = ContractFunctionReturnType<
  typeof RewardVesting,
  'view',
  'getAllDelayedReward'
>[number] & { id: bigint };

// reward vesting claim

export type RewardVestingClaimProps = CommonTransactionProps &
  RewardVestingClaimEncodeDataProps;

export type RewardVestingClaimInnerProps = Omit<
  CommonTransactionProps,
  'account'
> &
  RewardVestingClaimEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type RewardVestingClaimEncodeDataProps = {
  amountToClaim: bigint;
} & Partial<RewardVestingPancakeswapParams>;

export type RewardVestingPancakeswapParams = {
  deadline: number;
};

// reward vesting delayed reward claim

export type RewardVestingDelayedRewardClaimProps = CommonTransactionProps &
  RewardVestingDelayedRewardClaimEncodeDataProps;

export type RewardVestingDelayedRewardClaimInnerProps = Omit<
  CommonTransactionProps,
  'account'
> &
  RewardVestingDelayedRewardClaimEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type RewardVestingDelayedRewardClaimEncodeDataProps = {
  rewardId: bigint;
};

// genesis node deposit

export type GenesisNodeDepositProps = CommonTransactionProps &
  GenesisNodeDepositEncodeDataProps;

export type GenesisNodeDepositInnerProps = Omit<
  CommonTransactionProps,
  'account'
> &
  GenesisNodeDepositEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type GenesisNodeDepositEncodeDataProps = {
  depositValue: bigint;
} & GenesisNodeProofParam;

export type GenesisNodeProofParam = {
  proofs: Hex[];
  proofMaxDepositAmount: bigint;
};

export type GenesisNodeWhitelistParam = {
  userAddress: Address;
  maxDepositAmount: bigint;
};

// bond admin

export type LPBondingAdmin_SetModeProps = CommonTransactionProps & {
  modeId: bigint;
} & Partial<
    ContractFunctionArgs<typeof LPBonding, 'nonpayable', 'setMode'>['1']
  >;

export type LPBondingAdmin_DeleteModeProps = CommonTransactionProps & {
  modeId: bigint;
};

//// DAO Nft mintBySig

export type DAONftMintBySigProps = CommonTransactionProps &
  (Omit<DAONftMintBySigEncodeDataProps, '_data'> & { _data?: string });

export type DAONftMintBySigInnerProps = Omit<
  CommonTransactionProps,
  'account'
> &
  DAONftMintBySigEncodeDataProps & {
    account: JsonRpcAccount;
  };

export type DAONftMintBySigEncodeDataProps = {
  votingPoint: bigint;
  expiryTimestamp: number;
  mintDeadline: number;
  signature: Hex;
  signatureTimestamp: number;
  _data: string;
};

// genesis node admin

export type GenesisNodeAdmin_SetMinDepositLimitProps =
  CommonTransactionProps & {
    minDepositLimit: bigint;
  };

export type GenesisNodeAdmin_SetMaxLimitTotalDepositorProps =
  CommonTransactionProps & {
    maxLimitTotalDepositor: number;
  };

export type GenesisNodeAdmin_SetTreasuryAddressProps =
  CommonTransactionProps & {
    treasuryAddress: Address;
  };

export type GenesisNodeAdmin_SetStepToNormalizeDepositProps =
  CommonTransactionProps & {
    stepAmountToNormalize: bigint;
  };

export type GenesisNodeAdmin_SetMaxLimitTotalDepositProps =
  CommonTransactionProps & {
    maxLimitTotalDeposit: bigint;
  };

export type GenesisNodeAdmin_SetWhitelistProps = CommonTransactionProps & {
  lstWhitelist: GenesisNodeWhitelistParam[];
};

// genesis node views

export type GenesisNodePurchaseData = Pick<
  ContractFunctionReturnType<typeof GenesisNode, 'view', 'getUserInfo'>,
  'purchaseDeposit' | 'purchaseTimestamp'
> & {
  purchaseDepositFormatted: string;
  isUserPurchased: boolean;
  userAddress: Address;
};

// ark core global config

type ARKCoreSetAddressFunction = Pick<
  {
    [K in ContractFunctionName<typeof ARKCoreGlobalConfig, 'nonpayable'>]: K;
  },
  | 'setBaseToken'
  | 'setRewardPool'
  | 'setDaoPool'
  | 'setLpPool'
  | 'setOlympus__BondFixedTermTeller'
  | 'setOlympus__Operator'
  | 'setOlympus__VohmVault'
  | 'setTreasury'
  | 'setSigner'
  | 'setPrincipalToken'
  | 'setRewardVesting'
  | 'setSwapRouter'
  | 'setBaseTokenMinter'
>;

export type ARKCoreAdmin_SetAddressProps = CommonTransactionProps & {
  newAddress: Address;
  setAddressFunction: ARKCoreSetAddressFunction[keyof ARKCoreSetAddressFunction];
};

export type ARKCoreAdmin_SetDailySupplyLimit_baseEmissionRate =
  CommonTransactionProps & {
    baseEmissionRate: number;
  };

export type ARKCoreAdmin_SetDailySupplyLimit_minPremium =
  CommonTransactionProps & {
    minPremium: bigint;
  };

export type ARKCoreAdmin_SetMaxRedeemBondAllowance = CommonTransactionProps & {
  maxRedeemBondAllowance: bigint;
};

export type ARKCoreAdmin_SetMaxStakeClaimAllowance = CommonTransactionProps & {
  maxStakeClaimAllowance: bigint;
};

export type ARKCoreAdmin_SetMintingCapLimit_buffer = CommonTransactionProps & {
  mintingCapLimit_buffer: number;
};

export type ARKCoreAdmin_SetMinimumLimitDeposit = CommonTransactionProps & {
  minimumLimitDeposit: bigint;
};

export type ARKCoreAdmin_SetRCMRatio = CommonTransactionProps & {
  rcmRatio: number;
};

export type ARKCoreAdmin_ModeId = { modeId: bigint };

export type ARKCoreAdmin_SetMode = CommonTransactionProps &
  Partial<
    ContractFunctionArgs<typeof ARKCoreGlobalConfig, 'nonpayable', 'setMode'>[1]
  > &
  ARKCoreAdmin_ModeId;

export type ARKCoreAdmin_CreateMode = CommonTransactionProps &
  Omit<
    ContractFunctionArgs<
      typeof ARKCoreGlobalConfig,
      'nonpayable',
      'setMode'
    >[1],
    'isActive' | 'isExist'
  >;

export type ARKCoreAdmin_DeleteMode = CommonTransactionProps &
  ARKCoreAdmin_ModeId;

// get ark token info
export type GetARKTokenInfo = Pick<
  {
    [k in ContractFunctionName<
      typeof ARK,
      'view'
    >[][number]]: ContractFunctionReturnType<typeof ARK, 'view', k>;
  },
  'name' | 'decimals' | 'symbol' | 'oracle' | 'rbs' | 'treasury'
> & {
  buyTaxRate: bigint;
  sellTaxRate: bigint;
  checkSellTaxAppliedTo: (address: Address) => Promise<boolean>;
  checkBuyTaxAppliedTo: (address: Address) => Promise<boolean>;
};

// get dao nft token per user
export type GetUserNftInfo = {
  totalVotingPointsForUser: number;
  balance: number;
  // nfts: ContractFunctionReturnType<typeof DAONft, 'view', 'getNftInfo'>[];
};
