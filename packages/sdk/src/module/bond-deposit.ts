import { decodeEventLog, encodeEventTopics, encodeFunctionData } from 'viem';

import type {
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
import { parseValue } from '../common/utils/parse-value.js';
import { ERROR_CODE, invariant, SDKError } from '../common/utils/sdk-error.js';
import {
  type PopulatedTransaction,
  TransactionOptions,
  type TransactionResult,
} from '../core/index.js';
import type { NoTxOptions } from '../core/types.js';

import { LPBonding } from './abi/LPBonding.js';
import { OlyV3_Operator } from './abi/OlyV3_Operator.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import type {
  BondDepositEncodeDataProps,
  BondDepositInnerProps,
  BondDepositPancakeswapParams,
  BondDepositProps,
} from './types.js';

export class ArkSDKBondDeposit extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async deposit(
    props: BondDepositProps,
  ): Promise<
    TransactionResult<ContractEventArgs<typeof LPBonding, 'BondDeposited'>>
  > {
    this.core.useWeb3Provider();
    const { callback, account, depositValue, modeId, ...rest } =
      await this.parseProps(props);
    const { deadline } = await this.preparePancakeswapParams({
      depositValue,
      modeId,
    });
    // await this.validateStakeLimit(depositValue);

    return this.core.performTransaction({
      ...rest,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractOlyV3Operator().write.bondPurchase__V3(
          [{ amount: depositValue, modeId, deadline }],
          { ...options },
        ),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.depositParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async depositSimulateTx(
    props: BondDepositProps,
  ): Promise<WriteContractParameters> {
    const { depositValue, modeId, account } = await this.parseProps(props);
    const { deadline } = await this.preparePancakeswapParams({
      depositValue,
      modeId,
    });
    const contract = this.getContractOlyV3Operator();
    const { request } = await contract.simulate.bondPurchase__V3(
      [{ amount: depositValue, modeId, deadline }],
      {
        account,
      },
    );

    return request;
  }

  // Views

  // @Logger('Views:')
  // @ErrorHandler()
  // public async getStakeLimitInfo(): Promise<StakeLimitResult> {}

  // Utils

  @Logger('Utils:')
  @Cache(30 * 1000, ['core.chain.id'])
  public async depositEstimateGas(
    props: NoTxOptions<BondDepositProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const { depositValue, modeId, account } = await this.parseProps(props);
    const { deadline } = await this.preparePancakeswapParams({
      depositValue,
      modeId,
    });
    const originalGasLimit =
      await this.getContractOlyV3Operator().estimateGas.bondPurchase__V3(
        [{ amount: depositValue, modeId, deadline }],
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
  private depositParseEvents(receipt: TransactionReceipt) {
    let depositEvent:
      | ContractEventArgs<typeof LPBonding, 'BondDeposited'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: LPBonding,
          eventName: 'BondDeposited',
        })[0] // BondDeposited
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: LPBonding,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'BondDeposited') {
        depositEvent = parsedLog.args;
      }
    }

    invariant(
      depositEvent,
      'could not find BondDeposited event in deposit transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return depositEvent;
  }

  // @Logger('Utils:')
  // private async validateStakeLimit(value: bigint): Promise<void> {
  //   const { currentStakeLimit } = await this.getStakeLimitInfo();

  //   if (value > currentStakeLimit) {
  //     throw this.core.error({
  //       code: ERROR_CODE.TRANSACTION_ERROR,
  //       message: `Stake value is greater than daily protocol staking limit (${currentStakeLimit})`,
  //     });
  //   }
  // }

  @Logger('Utils:')
  private async depositEncodeData(
    props: BondDepositEncodeDataProps,
  ): Promise<Hash> {
    const { depositValue, modeId } = props;
    const { deadline } = await this.preparePancakeswapParams(props);
    const account = this.core.web3Provider!.account;
    if (!account) {
      throw new SDKError({
        code: ERROR_CODE.PROVIDER_ERROR,
        message: "provider's account is empty",
      });
    }
    return encodeFunctionData({
      abi: OlyV3_Operator,
      functionName: 'bondPurchase__V3',
      args: [{ amount: depositValue, modeId, deadline }],
    });
  }

  @Logger('Utils:')
  public async depositPopulateTx(
    props: BondDepositProps,
  ): Promise<PopulatedTransaction> {
    const { depositValue, modeId, account } = await this.parseProps(props);
    const data = await this.depositEncodeData({ depositValue, modeId });
    const gas = await this.depositEstimateGas(props, {
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
    props: BondDepositEncodeDataProps,
  ): Promise<BondDepositPancakeswapParams> {
    const deadline = props.deadline || Math.floor(Date.now() / 1000) + 60;

    return {
      deadline,
    };
  }

  private async parseProps(
    props: BondDepositProps,
  ): Promise<BondDepositInnerProps> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      depositValue: parseValue(props.depositValue),
      callback: props.callback ?? NOOP,
    };
  }
}
