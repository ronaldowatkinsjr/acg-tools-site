import {
  Address,
  ContractFunctionArgs,
  ContractFunctionName,
  ContractFunctionParameters,
  ContractFunctionReturnType,
  formatEther,
  getAddress,
  Hex
} from 'viem';
import { Cache, Logger } from '../common/decorators/index.js';

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import {
  ARK_CONTRACT_NAMES,
  ERROR_CODE,
  invariant,
  SDKError,
} from '../common/index.js';
import { ARK } from './abi/ARK.js';
import { DAONft } from './abi/DAONft.js';
import { GenesisNode } from './abi/GenesisNode.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import {
  DelayedRewardInfo,
  GenesisNodeProofParam,
  GenesisNodePurchaseData,
  GenesisNodeWhitelistParam,
  GetARKTokenInfo,
  GetBondMode,
  GetReleaseInfoFromRewardVesting,
  GetUserNftInfo,
} from './types.js';

export class ArkSDKLPBonding_Views extends ArkSDKLPBonding {
  //// Mode

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public async getAllModes(): Promise<GetBondMode[]> {
    const modes = await this.getContractLPBonding().read.getAllModes();

    return modes
      .map<GetBondMode>((data, i) => ({
        ...data,
        modeId: BigInt(i),
        vestingPeriodInDays: data.vestingPeriod / 86400,
        discountRate_formatted: data.discountRate / 100,
        interestRate_formatted: data.interestRate / 100,
      }))
      .sort((a, b) => a.vestingPeriod - b.vestingPeriod);
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public async getAllActiveModes(): Promise<GetBondMode[]> {
    const modes = await this.getAllModes();

    return modes
      .filter((mode) => mode.isActive && mode.modeId != BigInt(0))
      .sort((a, b) => a.vestingPeriod - b.vestingPeriod);
  }

  @Logger('Contracts:')
  @Cache(30 * 1000, ['core.chain.id'])
  public async getChainPrice(): Promise<bigint> {
    return await this.getContractLPBonding().read.getChainPrice();
  }

  @Logger('Contracts:')
  @Cache(10 * 1000, ['core.chain.id'])
  public async getAllDelayedRewardInfoFromRewardVesting(
    account: Address,
  ): Promise<DelayedRewardInfo[]> {
    return (
      await this.getContractRewardVesting().read.getAllDelayedReward([account])
    ).map((data, i) => ({
      ...data,
      id: BigInt(i),
    }));
  }

  @Logger('Contracts:')
  public async getPendingReleaseFromRewardVesting(
    account: Address,
    claimTimestamp: number = Math.floor(Date.now() / 1000),
  ): Promise<bigint> {
    return await this.getContractRewardVesting().read.getAllVestingClaimable([
      account,
      BigInt(claimTimestamp),
      [
        ...Array(
          (await this.getContractRewardVesting().read.getUserInfo([account]))
            .rewardVestingNextIdEntry, // total release (rewardvesting) entries by the user
        ).keys(),
      ].map((i) => BigInt(i)), // array of release (rewardvesting) id
    ]);
  }

  @Logger('Contracts:')
  @Cache(10 * 1000, ['core.chain.id'])
  public async getReleaseInfoFromRewardVesting(
    account: Address,
  ): Promise<GetReleaseInfoFromRewardVesting[]> {
    const releaseInfo =
      await this.getContractRewardVesting().read.getRewardVesting([account]);

    return releaseInfo.map((data, i) => ({
      ...data,
      isFullyClaimed: data.amount - data.claimed == BigInt(0),
      vestingEndDateTimestamp: data.createdAt + data.vestingPeriod,
      modeId: i,
    }));
  }

  @Logger('Contracts:')
  public async getRequiredUSDTBalanceForRewardVestingActions(
    amountARK: bigint,
  ): Promise<{ quoted: bigint; quotedWithSlippage: bigint }> {
    // ensure amountARK > 0
    invariant(
      amountARK > 0,
      'amountARK must not be zero',
      ERROR_CODE.INVALID_ARGUMENT,
    );

    // fetch quote amount from v2 pool
    const amountIn = (
      await this.getContractRouterV2().read.getAmountsIn([
        amountARK,
        [
          this.core.getContractAddress(ARK_CONTRACT_NAMES.usdt),
          this.core.getContractAddress(ARK_CONTRACT_NAMES.ark),
        ],
      ])
    )[0];

    invariant(
      amountIn != undefined,
      'quoteAmountIn from getAmountsIn() is undefined',
      ERROR_CODE.PROVIDER_ERROR,
    );

    return {
      quoted: amountIn,
      quotedWithSlippage: (amountIn * 107_00n) / 100_00n, // slippage 7%
    };
  }

  @Logger('Contracts:')
  @Cache(10 * 1000, ['core.chain.id'])
  public async getProofParamForGenesisNodeDeposit(
    account: Address,
    lstAllWhitelist: GenesisNodeWhitelistParam[],
  ): Promise<GenesisNodeProofParam> {
    // throw error if user is not whitelisted
    if (
      lstAllWhitelist.filter(
        (whitelisted) =>
          account.toLowerCase() == whitelisted.userAddress.toLowerCase(),
      ).length == 0
    ) {
      throw new SDKError({
        code: ERROR_CODE.INVALID_ARGUMENT,
        message: `Cannot find account ${account} in the given whitelist`,
      });
    }

    // build merkle tree
    const merkleTree = StandardMerkleTree.of(
      lstAllWhitelist.map(({ userAddress, maxDepositAmount }) => [
        getAddress(userAddress),
        maxDepositAmount,
      ]),
      ['address', 'uint256'],
    );

    // obtain & return proof if user is whitelisted
    for (const [i, v] of merkleTree.entries()) {
      if (v[0] == undefined) {
        continue;
      }
      if ((v[0] as Address).toLowerCase() === account.toLowerCase()) {
        const proofs = merkleTree.getProof(i) as Hex[];
        return {
          proofs,
          proofMaxDepositAmount: lstAllWhitelist.find(
            ({ userAddress }) =>
              userAddress.toLowerCase() == account.toLowerCase(),
          )!.maxDepositAmount,
        };
      }
    }

    // throw error if failed to generate proof
    throw new SDKError({
      code: ERROR_CODE.INVALID_ARGUMENT,
      message: `Cannot generate proof for account ${account}`,
    });
  }

  public async getPurchaseDataFromGenesisNode(
    account: Address,
  ): Promise<GenesisNodePurchaseData>;
  public async getPurchaseDataFromGenesisNode(
    account: Address[],
  ): Promise<GenesisNodePurchaseData[]>;
  @Logger('Contracts:')
  @Cache(10 * 1000, ['core.chain.id'])
  public async getPurchaseDataFromGenesisNode(
    account: Address | Address[],
  ): Promise<GenesisNodePurchaseData | GenesisNodePurchaseData[]> {
    if (typeof account != 'object') {
      const resp = await this.getContractGenesisNode().read.getUserInfo([
        account,
      ]);
      return {
        isUserPurchased: resp.isUserRevoked,
        purchaseDeposit: resp.purchaseDeposit,
        purchaseDepositFormatted: formatEther(resp.purchaseDeposit),
        purchaseTimestamp: resp.purchaseTimestamp,
        userAddress: account,
      } satisfies GenesisNodePurchaseData;
    } else {
      const resp = (await this.core.rpcProvider.multicall({
        contracts: account.map(
          (acc) =>
            ({
              abi: GenesisNode,
              address: this.getContractGenesisNode().address,
              functionName: 'getUserInfo' satisfies ContractFunctionName<
                typeof GenesisNode,
                'view'
              >,
              args: [acc] satisfies ContractFunctionArgs<
                typeof GenesisNode,
                'view',
                'getUserInfo'
              >,
            }) as ContractFunctionParameters,
        ),
        allowFailure: false,
      })) as ContractFunctionReturnType<
        typeof GenesisNode,
        'view',
        'getUserInfo'
      >[];

      return resp.map(
        (data, i) =>
          ({
            isUserPurchased: data.isUserRevoked,
            purchaseDeposit: data.purchaseDeposit,
            purchaseDepositFormatted: formatEther(data.purchaseDeposit),
            purchaseTimestamp: data.purchaseTimestamp,
            userAddress: account[i]!,
          }) satisfies GenesisNodePurchaseData,
      );
    }
  }

  @Logger('Contracts:')
  @Cache(10 * 1000, ['core.chain.id'])
  public async getARKTokenInfo(): Promise<GetARKTokenInfo> {
    const lstInfo = [
      'name',
      'decimals',
      'symbol',
      'oracle',
      'rbs',
      'treasury',
      'shortGovernanceRatio',
      'longGovernanceRatio',
    ] satisfies ContractFunctionName<typeof ARK, 'view'>[];

    type MulticallResp = {
      [k in (typeof lstInfo)[number]]: ContractFunctionReturnType<
        typeof ARK,
        'view',
        k
      >;
    };

    const resp: MulticallResp = Object.fromEntries(
      (
        (
          await this.core.rpcProvider.multicall({
            contracts: lstInfo.map(
              (functionName) =>
                ({
                  abi: ARK,
                  address: this.core.getContractAddress(ARK_CONTRACT_NAMES.ark),
                  functionName,
                }) as ContractFunctionParameters,
            ),
            allowFailure: true,
          })
        ).map((data) => data.result) as ContractFunctionReturnType<
          typeof ARK,
          'view',
          (typeof lstInfo)[number]
        >[]
      ).map((data, i) => [lstInfo[i], data]),
    ) satisfies MulticallResp;

    return {
      ...resp,
      buyTaxRate: resp.longGovernanceRatio,
      sellTaxRate: resp.shortGovernanceRatio,
      checkSellTaxAppliedTo: async (address: Address) =>
        await this.core.rpcProvider.readContract({
          abi: ARK,
          functionName: 'shortGovernanceList',
          args: [address],
          address: this.core.getContractAddress(ARK_CONTRACT_NAMES.ark),
        }),
      checkBuyTaxAppliedTo: async (address: Address) =>
        await this.core.rpcProvider.readContract({
          abi: ARK,
          functionName: 'longGovernanceList',
          args: [address],
          address: this.core.getContractAddress(ARK_CONTRACT_NAMES.ark),
        }),
    };
  }

  @Logger('Contracts:')
  @Cache(5 * 1000, ['core.chain.id'])
  public async getUserNftInfo(userAddress: Address): Promise<GetUserNftInfo> {
    const functionNames = [
      'balanceOf',
      'getUserInfo',
    ] satisfies ContractFunctionName<typeof DAONft, 'view'>[];

    const resp = Object.fromEntries(
      (
        await this.core.rpcProvider.multicall({
          contracts: functionNames.map((functionName) => ({
            abi: DAONft,
            address: this.core.getContractAddress(ARK_CONTRACT_NAMES.daoNft),
            functionName,
            args: [userAddress],
          })),
          allowFailure: false,
        })
      ).map((data, i) => [functionNames[i], data]),
    ) as {
      [k in (typeof functionNames)[number]]: ContractFunctionReturnType<
        typeof DAONft,
        'view',
        k
      >;
    };

    return {
      balance: Number(resp.balanceOf),
      totalVotingPointsForUser: Number(resp.getUserInfo.mintedVotingPoints),
    };
  }
}
