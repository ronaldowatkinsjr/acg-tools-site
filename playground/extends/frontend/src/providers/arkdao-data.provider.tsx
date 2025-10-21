import {
  ARK_CONTRACT_NAMES,
  ArkSDK_ArkToken,
  ArkSDK_BETH,
  ArkSDK_USDT,
  ERROR_CODE,
  SDKError,
  TransactionResult,
} from '@a42n-olympus/ark-dao-sdk';
import { AxiosError } from 'axios';
import Decimal from 'decimal.js';
import { useArkSDK } from 'providers/sdk';
import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
} from 'react';
import { Address, ContractEventArgs, parseEther } from 'viem';
import { useAccount } from 'wagmi';
import { BondService } from '../services/BondService';
import {
  validateAddress,
  validateRequiredData,
} from '../utils/validation-utils';

// ================================
// CONTRACT ADDRESSES INTERFACE
// ================================

interface ContractAddresses {
  arkTokenAddress: Address;
  usdtTokenAddress: Address;
  bondDepositAddress: Address;
  bondRedeemAddress: Address;
  arkStakingAddress: Address;
  lpPoolAddress: Address;
  v2RouterAddress: Address;
}

// ================================
// TRANSACTION FUNCTIONS
// ================================

interface TransactionFunctions {
  withdrawLPBondingCapital: (
    amount: Decimal,
    bondId: string,
    onDAONftNotClaimed?: (bondId: string) => Promise<void>,
  ) => Promise<TransactionResult<ContractEventArgs>>;
  withdrawStaking: (
    amount: Decimal,
    modeId: string,
    onDAONftNotClaimed?: (bondId: string) => Promise<void>,
  ) => Promise<TransactionResult<ContractEventArgs>>;
}

// ================================
// ARK DAO Token Types
// ================================

interface ARKDAOTokens {
  arkToken: ArkSDK_ArkToken;
  usdtToken: ArkSDK_USDT;
  bETHToken: ArkSDK_BETH;
}

// ================================
// MAIN CONTEXT TYPE
// ================================

interface ArkDAOContextType
  extends ContractAddresses,
    TransactionFunctions,
    ARKDAOTokens {}

// ================================
// INITIAL STATE
// ================================

const ArkDAODataContext = createContext<ArkDAOContextType | null>(null);

export const useArkDAO = () => {
  const context = useContext(ArkDAODataContext);
  if (!context) {
    throw new Error('useArkDAO must be used within an ArkDAODataProvider');
  }
  return context;
};

export const ArkDAODataProvider: React.FC<PropsWithChildren> = ({
  children,
}) => {
  const sdk = useArkSDK();
  const { address } = useAccount();

  if (!sdk) {
    throw new Error('ArkDAODataProvider must be used within an ArkSDKProvider');
  }

  // ================================
  // CONTRACT ADDRESSES
  // ================================

  const contractAddresses: ContractAddresses = {
    arkTokenAddress: sdk.ark.contractAddress(),
    usdtTokenAddress: sdk.usdt.contractAddress(),
    bondDepositAddress: sdk.bondDeposit.getContractOlyV3Operator().address,
    bondRedeemAddress:
      sdk.bondDeposit.getContractOlyV3BondFixedTermTeller().address,
    arkStakingAddress: sdk.stakeDeposit.getContractOlyV3VARKVault().address,
    lpPoolAddress: sdk.core.getContractAddress(ARK_CONTRACT_NAMES.V2Pool),
    v2RouterAddress: sdk.core.getContractAddress(ARK_CONTRACT_NAMES.routerV2),
  };

  // ================================
  // ARK DAO TOKENS
  // ================================

  const arkTokens: ARKDAOTokens = {
    arkToken: sdk.ark,
    usdtToken: sdk.usdt,
    bETHToken: sdk.bETH,
  };

  // ================================
  // TRANSACTION FUNCTIONS
  // ================================

  const NftNotClaimedError = new SDKError({
    code: ERROR_CODE.TRANSACTION_ERROR,
    error: 'Nft not claimed',
    message: 'Must claim the DAO Nft first before redeeming bond principal',
  });

  const withdrawLPBondingCapital = useCallback(
    async (
      amount: Decimal,
      bondId: string,
      onDAONftNotClaimed?: (bondId: string) => Promise<void>,
    ): Promise<TransactionResult<ContractEventArgs>> => {
      validateAddress(address, 'Wallet address');
      validateRequiredData(bondId, 'Bond ID');

      const formattedAmount = parseEther(amount.toString());
      let bondData;
      let bondSignature;

      try {
        const { data, signature } = await BondService.claimPrincipal(bondId, {
          amount: amount.toString(),
        });
        bondData = data;
        bondSignature = signature;
      } catch (error) {
        if (
          error instanceof AxiosError &&
          error.response?.data.message.includes('error.daoNftIsNotClaimed')
        ) {
          // trigger callback if defined
          if (onDAONftNotClaimed) onDAONftNotClaimed(bondId);

          // throw error
          throw NftNotClaimedError;
        }

        throw new Error('BondService.claimPrincipal: unknown error');
      }

      // Simulate transaction first to catch issues early
      await sdk.bondRedeem.redeemBondSimulateTx({
        redeemBondAmount: formattedAmount,
        signature: bondSignature as `0x${string}`,
        signatureTimestamp: BigInt(bondData.timestamp),
        nfDaoTokenId: BigInt(bondData.nftDaoTokenId),
        nftDaoVotingPointsToBurn: BigInt(bondData.nftDaoVotingPointsToBurn),
        _data: bondData.id,
      });

      return sdk.bondRedeem.redeemBond({
        redeemBondAmount: formattedAmount,
        signature: bondSignature as `0x${string}`,
        signatureTimestamp: BigInt(bondData.timestamp),
        nfDaoTokenId: BigInt(bondData.nftDaoTokenId),
        nftDaoVotingPointsToBurn: BigInt(bondData.nftDaoVotingPointsToBurn),
        _data: bondData.id,
      });
    },
    [sdk, address],
  );

  const withdrawStaking = useCallback(
    async (
      amount: Decimal,
      bondId: string,
      onDAONftNotClaimed?: (bondId: string) => Promise<void>,
    ): Promise<TransactionResult<ContractEventArgs>> => {
      validateAddress(address, 'Wallet address');
      validateRequiredData(bondId, 'Bond ID');

      const formattedAmount = parseEther(amount.toString());
      let stakeData;
      let stakeSignature;

      try {
        const { data, signature } = await BondService.claimPrincipal(bondId, {
          amount: amount.toString(),
        });
        stakeData = data;
        stakeSignature = signature;
      } catch (error) {
        if (
          error instanceof AxiosError &&
          error.response?.data.message.includes('error.daoNftIsNotClaimed')
        ) {
          // trigger callback if defined
          if (onDAONftNotClaimed) onDAONftNotClaimed(bondId);

          // throw error
          throw NftNotClaimedError;
        }

        throw new Error('BondService.claimPrincipal: unknown error');
      }

      // Simulate transaction first to catch issues early
      await sdk.stakeClaim.stakeClaimSimulateTx({
        claimAmount: formattedAmount,
        signature: stakeSignature as `0x${string}`,
        signatureTimestamp: BigInt(stakeData.timestamp),
        nfDaoTokenId: BigInt(stakeData.nftDaoTokenId),
        nftDaoVotingPointsToBurn: BigInt(stakeData.nftDaoVotingPointsToBurn),
        _data: stakeData.id,
      });

      return sdk.stakeClaim.stakeClaim({
        claimAmount: formattedAmount,
        signature: stakeSignature as `0x${string}`,
        signatureTimestamp: BigInt(stakeData.timestamp),
        nfDaoTokenId: BigInt(stakeData.nftDaoTokenId),
        nftDaoVotingPointsToBurn: BigInt(stakeData.nftDaoVotingPointsToBurn),
        _data: stakeData.id,
      });
    },
    [sdk, address],
  );

  // ================================
  // CONTEXT VALUE
  // ================================

  const contextValue: ArkDAOContextType = {
    // Contract addresses
    ...contractAddresses,

    // ARK DAO Tokens
    ...arkTokens,

    // Transaction functions
    withdrawLPBondingCapital,
    withdrawStaking,
  };

  return (
    <ArkDAODataContext.Provider value={contextValue}>
      {children}
    </ArkDAODataContext.Provider>
  );
};
