import { decodeEventLog, encodeEventTopics, encodeFunctionData } from 'viem';

import type {
  Account,
  ContractEventArgs,
  Hash,
  TransactionReceipt,
  WriteContractParameters,
} from 'viem';

import {
  GAS_TRANSACTION_RATIO_PRECISION,
  NOOP,
  SUBMIT_EXTRA_GAS_TRANSACTION_RATIO,
} from '../common/constants.js';
import { Cache, ErrorHandler, Logger } from '../common/decorators/index.js';
import { ERROR_CODE, invariant } from '../common/utils/sdk-error.js';
import {
  type PopulatedTransaction,
  TransactionOptions,
  type TransactionResult,
} from '../core/index.js';
import type { NoTxOptions } from '../core/types.js';

import { RewardVesting } from './abi/RewardVesting.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import type {
  RewardVestingDelayedRewardClaimEncodeDataProps,
  RewardVestingDelayedRewardClaimInnerProps,
  RewardVestingDelayedRewardClaimProps,
} from './types.js';

export class ArkSDKRewardVestingDelayedRewardClaim extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async claimDelayedReward(
    props: RewardVestingDelayedRewardClaimProps,
  ): Promise<
    TransactionResult<
      ContractEventArgs<typeof RewardVesting, 'DelayedRewardClaimed'>
    >
  > {
    this.core.useWeb3Provider();
    const { callback, account, rewardId, ...rest } =
      await this.parseProps(props);

    const contract = this.getContractRewardVesting();

    return this.core.performTransaction({
      ...rest,
      callback,
      account,
      sendTransaction: (options) =>
        contract.write.claimDelayedReward([rewardId], { ...options }),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.claimDelayedRewardParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async claimDelayedRewardSimulateTx(
    props: RewardVestingDelayedRewardClaimProps,
  ): Promise<WriteContractParameters> {
    const { rewardId, account } = await this.parseProps(props);
    const contract = this.getContractRewardVesting();
    const { request } = await contract.simulate.claimDelayedReward([rewardId], {
      account,
    });

    return request;
  }

  // Utils

  @Logger('Utils:')
  @Cache(30 * 1000, ['core.chain.id'])
  public async claimDelayedRewardEstimateGas(
    props: NoTxOptions<RewardVestingDelayedRewardClaimProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const { rewardId, account } = await this.parseProps(props);
    const contract = this.getContractRewardVesting();
    const originalGasLimit = await contract.estimateGas.claimDelayedReward(
      [rewardId],
      {
        account,
        ...options,
      },
    );

    const gasLimit =
      (originalGasLimit *
        BigInt(
          GAS_TRANSACTION_RATIO_PRECISION * SUBMIT_EXTRA_GAS_TRANSACTION_RATIO,
        )) /
      BigInt(GAS_TRANSACTION_RATIO_PRECISION);

    return gasLimit;
  }

  @Logger('Utils:')
  private claimDelayedRewardParseEvents(receipt: TransactionReceipt) {
    let claimDelayedRewardEvent:
      | ContractEventArgs<typeof RewardVesting, 'DelayedRewardClaimed'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: RewardVesting,
          eventName: 'DelayedRewardClaimed',
        })[0] // RewardClaimed
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: RewardVesting,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'DelayedRewardClaimed') {
        claimDelayedRewardEvent = parsedLog.args;
      }
    }

    invariant(
      claimDelayedRewardEvent,
      'could not find RewardClaimed event in deposit transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return claimDelayedRewardEvent;
  }

  @Logger('Utils:')
  private async claimDelayedRewardEncodeData(
    props: RewardVestingDelayedRewardClaimEncodeDataProps & {
      account: Account;
    },
  ): Promise<Hash> {
    const { rewardId } = await this.parseProps(props);
    return encodeFunctionData({
      abi: RewardVesting,
      functionName: 'claimDelayedReward',
      args: [rewardId],
    });
  }

  @Logger('Utils:')
  public async claimDelayedRewardPopulateTx(
    props: RewardVestingDelayedRewardClaimProps,
  ): Promise<PopulatedTransaction> {
    const { rewardId, account } = await this.parseProps(props);
    const data = await this.claimDelayedRewardEncodeData({
      rewardId,
      account,
    });
    const gas = await this.claimDelayedRewardEstimateGas(props, {
      chain: this.core.chain,
      account,
    });
    const address = this.contractAddressLPBonding();
    return {
      to: address,
      from: account.address,
      gas,
      data,
    };
  }

  private async parseProps(
    props: RewardVestingDelayedRewardClaimProps,
  ): Promise<RewardVestingDelayedRewardClaimInnerProps> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      callback: props.callback ?? NOOP,
    };
  }
}
