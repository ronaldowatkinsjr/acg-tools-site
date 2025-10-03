import { decodeEventLog, encodeEventTopics, encodeFunctionData } from 'viem';

import type {
  Account,
  Address,
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
  RewardVestingClaimEncodeDataProps,
  RewardVestingClaimInnerProps,
  RewardVestingClaimProps,
  RewardVestingPancakeswapParams,
} from './types.js';

export class ArkSDKRewardVestingClaim extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async claimReward(
    props: RewardVestingClaimProps,
  ): Promise<
    TransactionResult<ContractEventArgs<typeof RewardVesting, 'RewardClaimed'>>
  > {
    this.core.useWeb3Provider();
    const {
      callback,
      account,
      amountToClaim,
      deadline: _deadline,
      ...rest
    } = await this.parseProps(props);
    const { deadline } = await this.preparePancakeswapParams({
      amountToClaim,
      deadline: _deadline,
      account,
    });
    const lstRewardVestingIds = await this.fetchLstEligibleRewardIds(
      account.address,
    );

    const contract = this.getContractRewardVesting();

    return this.core.performTransaction({
      ...rest,
      callback,
      account,
      sendTransaction: (options) =>
        contract.write.claimRewardVesting(
          [amountToClaim, lstRewardVestingIds, deadline],
          { ...options },
        ),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.claimRewardParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async claimRewardSimulateTx(
    props: RewardVestingClaimProps,
  ): Promise<WriteContractParameters> {
    const {
      amountToClaim,
      deadline: _deadline,
      account,
    } = await this.parseProps(props);
    const { deadline } = await this.preparePancakeswapParams({
      amountToClaim,
      deadline: _deadline,
      account,
    });
    const lstRewardVestingIds = await this.fetchLstEligibleRewardIds(
      account.address,
    );
    const contract = this.getContractRewardVesting();
    const { request } = await contract.simulate.claimRewardVesting(
      [amountToClaim, lstRewardVestingIds, deadline],
      {
        account,
      },
    );

    return request;
  }

  // Utils

  @Logger('Utils:')
  @Cache(30 * 1000, ['core.chain.id'])
  public async claimRewardEstimateGas(
    props: NoTxOptions<RewardVestingClaimProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const {
      amountToClaim,
      deadline: _deadline,
      account,
    } = await this.parseProps(props);
    const { deadline } = await this.preparePancakeswapParams({
      amountToClaim,
      deadline: _deadline,
      account,
    });
    const lstRewardVestingIds = await this.fetchLstEligibleRewardIds(
      account.address,
    );
    const contract = this.getContractRewardVesting();
    const originalGasLimit = await contract.estimateGas.claimRewardVesting(
      [amountToClaim, lstRewardVestingIds, deadline],
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
  private claimRewardParseEvents(receipt: TransactionReceipt) {
    let claimRewardEvent:
      | ContractEventArgs<typeof RewardVesting, 'RewardClaimed'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: RewardVesting,
          eventName: 'RewardClaimed',
        })[0] // RewardClaimed
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: RewardVesting,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'RewardClaimed') {
        claimRewardEvent = parsedLog.args;
      }
    }

    invariant(
      claimRewardEvent,
      'could not find RewardClaimed event in deposit transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return claimRewardEvent;
  }

  @Logger('Utils:')
  private async claimRewardEncodeData(
    props: RewardVestingClaimEncodeDataProps & { account: Account },
  ): Promise<Hash> {
    const {
      amountToClaim,
      deadline: _deadline,
      account,
    } = await this.parseProps(props);
    const { deadline } = await this.preparePancakeswapParams({
      amountToClaim,
      deadline: _deadline,
      account,
    });
    const lstRewardVestingIds = await this.fetchLstEligibleRewardIds(
      account.address,
    );
    return encodeFunctionData({
      abi: RewardVesting,
      functionName: 'claimRewardVesting',
      args: [amountToClaim, lstRewardVestingIds, deadline],
    });
  }

  @Logger('Utils:')
  public async claimRewardPopulateTx(
    props: RewardVestingClaimProps,
  ): Promise<PopulatedTransaction> {
    const { amountToClaim, deadline, account } = await this.parseProps(props);
    const data = await this.claimRewardEncodeData({
      amountToClaim,
      deadline,
      account,
    });
    const gas = await this.claimRewardEstimateGas(props, {
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

  @Logger('Utils:')
  public async preparePancakeswapParams(
    props: RewardVestingClaimEncodeDataProps & { account: Account },
  ): Promise<RewardVestingPancakeswapParams> {
    // assign deadline
    const deadline = props.deadline || Math.floor(Date.now() / 1000) + 60;

    return {
      deadline,
    };
  }

  private async fetchLstEligibleRewardIds(account: Address): Promise<bigint[]> {
    return (
      await this.getContractRewardVesting().read.getRewardVesting([account])
    ).reduce<bigint[]>(
      (out, data, i) =>
        data.amount > data.claimed ? [...out, BigInt(i)] : out,
      [],
    );
  }

  private async parseProps(
    props: RewardVestingClaimProps,
  ): Promise<RewardVestingClaimInnerProps> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      callback: props.callback ?? NOOP,
    };
  }
}
