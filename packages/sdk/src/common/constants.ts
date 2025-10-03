import { type Address, type Chain } from 'viem';
import { bsc, bscTestnet, hardhat } from 'viem/chains';

export enum CHAINS {
  BSC_mainnet = 56,
  BSC_testnet = 97,
  dev = 31337,
}

export const APPROX_BLOCKS_BY_DAY = 7600n;
export const APPROX_SECONDS_PER_BLOCK = 12n;
export const SUPPORTED_CHAINS: CHAINS[] = [
  CHAINS.BSC_mainnet,
  CHAINS.BSC_testnet,
  CHAINS.dev,
];

export const SUBMIT_EXTRA_GAS_TRANSACTION_RATIO = 1.05;
export const GAS_TRANSACTION_RATIO_PRECISION = 10 ** 7;

export const CONTRACTS_BY_CHAIN: {
  [key in ARK_CONTRACT_NAMES]: { [key in CHAINS]?: Address };
} = {
  LPBonding: {
    56: '0xbc9e4BC9f839cE93Aba50b9315F31A9A2CBF7E08',
  },
  ARK: {
    56: '0xCae117ca6Bc8A341D2E7207F30E180f0e5618B9D',
  },
  USDT: {
    56: '0x55d398326f99059fF775485246999027B3197955',
  },
  RouterV2: {
    56: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
  },
  V2Pool: {
    56: '0xCAaF3c41a40103a23Eeaa4BbA468AF3cF5b0e0D8',
  },
  LPNftPosManager: {},
  RewardVesting: {
    56: '0x8366a748E02F730911Cb5AB4fd049d2E1e0414b7',
  },
  binanceETH: {
    56: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
  },
  GenesisNode: {
    56: '0x9c54BBddD314E2B30941cBc2e05d4F7D75881CEF',
  },
  DAONft: {
    56: '0xF5E3D1290FDBFC50ec436f021ad516D0Bcac5d28',
  },
  OlyV3_Operator: {
    56: '0xBA9D88e36475c9f92e830f5D2F52503582048aD0',
  },
  OlyV3_BondFixedTermTeller: {
    56: '0x74c28C5F3eBed5A0dE30ee3b7012849CFB4d1762',
  },
  OlyV3_VARKVault: {
    56: '0x9C0227570967314C86ed88238bc27eD017F37923',
  },
};

export const SUBRGRAPH_ID_BY_CHAIN: {
  [key in CHAINS]?: string;
} = {
  [CHAINS.BSC_mainnet]: 'Sxx812XgeKyzQPaBpR5YZWmGV5fZuBaPdh7DFhzSwiQ',
};

export const ARK_DAO_TOKENS = {
  ark: 'ARK',
  usdt: 'USDT',
  eth: 'ETH',
} as const;

export enum ARK_CONTRACT_NAMES {
  lpBonding = 'LPBonding',
  ark = 'ARK',
  usdt = 'USDT',
  routerV2 = 'RouterV2',
  V2Pool = 'V2Pool',
  LPNftPosManager = 'LPNftPosManager',
  rewardVesting = 'RewardVesting',
  binanceETH = 'binanceETH',
  genesisNode = 'GenesisNode',
  daoNft = 'DAONft',
  olyV3_Operator = 'OlyV3_Operator',
  olyV3_BondFixedTermTeller = 'OlyV3_BondFixedTermTeller',
  olyV3_VARKVault = 'OlyV3_VARKVault',
}
export const NOOP = () => {};

export const EIP2612_TYPE = [
  { name: 'owner', type: 'address' },
  { name: 'spender', type: 'address' },
  { name: 'value', type: 'uint256' },
  { name: 'nonce', type: 'uint256' },
  { name: 'deadline', type: 'uint256' },
] as const;

export const PERMIT_MESSAGE_TYPES = {
  EIP712Domain: [
    { name: 'name', type: 'string' },
    { name: 'version', type: 'string' },
    {
      name: 'chainId',
      type: 'uint256',
    },
    {
      name: 'verifyingContract',
      type: 'address',
    },
  ],
  Permit: EIP2612_TYPE,
} as const;

export const VIEM_CHAINS: { [key in CHAINS]: Chain } = {
  [CHAINS.BSC_mainnet]: bsc,
  [CHAINS.BSC_testnet]: bscTestnet,
  [CHAINS.dev]: hardhat,
};
