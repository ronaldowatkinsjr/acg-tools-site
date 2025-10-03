import { decodeEventLog, encodeEventTopics, encodeFunctionData } from 'viem';

import type {
  ContractEventArgs,
  ContractFunctionArgs,
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
import { parseValue } from '../common/utils/parse-value.js';
import { ERROR_CODE, invariant } from '../common/utils/sdk-error.js';
import {
  TransactionOptions,
  type PopulatedTransaction,
  type TransactionResult,
} from '../core/index.js';
import type { NoTxOptions } from '../core/types.js';

import { RewardVesting } from './abi/RewardVesting.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import {
  type RewardVestingPancakeswapParams,
  type RewardVestingRegisterEncodeDataProps,
  type RewardVestingRegisterInnerProps,
  type RewardVestingRegisterProps,
} from './types.js';

export class ArkSDKRewardVestingRegister extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async initiateVesting(
    props: RewardVestingRegisterProps,
  ): Promise<
    TransactionResult<
      ContractEventArgs<typeof RewardVesting, 'RewardVestingInitiated'>
    >
  > {
    this.core.useWeb3Provider();
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      ...parsedProps
    } = await this.parseProps(props);
    const { deadline } =
      await this.preparePancakeswapParamsForStaticReward(props);
    const contract = this.getContractRewardVesting();

    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        contract.write.initiateRewardVesting(
          this.parseContractFunctionParam({
            ...parsedProps,
            deadline,
          }),
          {
            ...options,
          },
        ),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.initiateVestingParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async initiateVestingSimulateTx(
    props: RewardVestingRegisterProps,
  ): Promise<WriteContractParameters> {
    const { account, ...parsedProps } = await this.parseProps(props);
    const { deadline } =
      await this.preparePancakeswapParamsForStaticReward(props);
    const contract = this.getContractRewardVesting();
    const { request } = await contract.simulate.initiateRewardVesting(
      this.parseContractFunctionParam({
        ...parsedProps,
        deadline,
      }),
      {
        account,
      },
    );

    return request;
  }

  // Views

  // Utils

  @Logger('Utils:')
  @Cache(30 * 1000, ['core.chain.id'])
  public async initiateVestingEstimateGas(
    props: NoTxOptions<RewardVestingRegisterProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const {
      account,
      callback,
      waitForTransactionReceiptParameters,
      ...parsedProps
    } = await this.parseProps(props);
    const { deadline } =
      await this.preparePancakeswapParamsForStaticReward(props);
    const contract = this.getContractRewardVesting();
    const originalGasLimit = await contract.estimateGas.initiateRewardVesting(
      this.parseContractFunctionParam({
        ...parsedProps,
        deadline,
      }),
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
  private initiateVestingParseEvents(receipt: TransactionReceipt) {
    let initiateVestingEvent:
      | ContractEventArgs<typeof RewardVesting, 'RewardVestingInitiated'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: RewardVesting,
          eventName: 'RewardVestingInitiated',
        })[0] // RewardVestingInitiated
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: RewardVesting,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'RewardVestingInitiated') {
        initiateVestingEvent = parsedLog.args;
      }
    }

    invariant(
      initiateVestingEvent,
      'could not find RewardVestingInitiated event in deposit transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return initiateVestingEvent;
  }

  @Logger('Utils:')
  private async initiateVestingEncodeData(
    props: RewardVestingRegisterEncodeDataProps,
  ): Promise<Hash> {
    const { deadline } =
      await this.preparePancakeswapParamsForStaticReward(props);
    return encodeFunctionData({
      abi: RewardVesting,
      functionName: 'initiateRewardVesting',
      args: this.parseContractFunctionParam({
        ...props,
        deadline,
      }),
    });
  }

  @Logger('Utils:')
  public async initiateVestingPopulateTx(
    props: RewardVestingRegisterProps,
  ): Promise<PopulatedTransaction> {
    const {
      callback,
      waitForTransactionReceiptParameters,
      account,
      ...parsedProps
    } = await this.parseProps(props);
    const data = await this.initiateVestingEncodeData(parsedProps);
    const gas = await this.initiateVestingEstimateGas(props, {
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
  private async preparePancakeswapParamsForStaticReward(
    props: Pick<RewardVestingRegisterProps, 'deadline' | 'rewardType'>,
  ): Promise<RewardVestingPancakeswapParams> {
    // assign deadline
    const deadline = props.deadline || Math.floor(Date.now() / 1000) + 60;

    return {
      deadline,
    };
  }

  private async parseProps(
    props: RewardVestingRegisterProps,
  ): Promise<RewardVestingRegisterInnerProps> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      claimAmount: parseValue(props.claimAmount),
      burnAmount: parseValue(props.burnAmount),
      deadline: props.deadline || 0,
      _data: props._data || '',
      callback: props.callback ?? NOOP,
    };
  }

  private parseContractFunctionParam(
    props: RewardVestingRegisterEncodeDataProps,
  ) {
    return [
      {
        _data: props._data,
        claimAmount: props.claimAmount,
        burnAmount: props.burnAmount,
        vestingPeriod: props.vestingPeriod,
        rewardType: props.rewardType,
        timestamp: props.timestamp,
      },
      props.deadline,
      props.signature,
    ] satisfies ContractFunctionArgs<
      typeof RewardVesting,
      'nonpayable',
      'initiateRewardVesting'
    >;
  }
}
