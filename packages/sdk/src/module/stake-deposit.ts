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
import { ArkSDKLPBonding } from './lp-bonding.js';
import type {
  StakeDepositEncodeDataProps,
  StakeDepositInnerProps,
  StakeDepositProps,
} from './types.js';

export class ArkSDKStakeDeposit extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async stake(
    props: StakeDepositProps,
  ): Promise<
    TransactionResult<ContractEventArgs<typeof LPBonding, 'StakeDeposit'>>
  > {
    this.core.useWeb3Provider();
    const { callback, account, stakeValue, modeId, ...rest } =
      await this.parseProps(props);

    // await this.validateStakeLimit(stakeValue);

    return this.core.performTransaction({
      ...rest,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractOlyV3VARKVault().write.deposit__V3(
          [stakeValue, modeId],
          {
            ...options,
          },
        ),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.stakeParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async stakeSimulateTx(
    props: StakeDepositProps,
  ): Promise<WriteContractParameters> {
    const { stakeValue, modeId, account } = await this.parseProps(props);
    const contract = this.getContractOlyV3VARKVault();
    const { request } = await contract.simulate.deposit__V3(
      [stakeValue, modeId],
      {
        account,
      },
    );

    return request;
  }

  // Utils

  @Logger('Utils:')
  @Cache(30 * 1000, ['core.chain.id'])
  public async stakeEstimateGas(
    props: NoTxOptions<StakeDepositProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const { stakeValue, modeId, account } = await this.parseProps(props);
    const originalGasLimit =
      await this.getContractOlyV3VARKVault().estimateGas.deposit__V3(
        [stakeValue, modeId],
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
  private stakeParseEvents(receipt: TransactionReceipt) {
    let stakeEvent:
      | ContractEventArgs<typeof LPBonding, 'StakeDeposit'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: LPBonding,
          eventName: 'StakeDeposit',
        })[0] // StakeDeposit
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: LPBonding,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'StakeDeposit') {
        stakeEvent = parsedLog.args;
      }
    }

    invariant(
      stakeEvent,
      'could not find StakeDeposit event in stake transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return stakeEvent;
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
  private async stakeEncodeData(
    props: StakeDepositEncodeDataProps,
  ): Promise<Hash> {
    const { stakeValue, modeId } = props;
    const account = this.core.web3Provider!.account;
    if (!account) {
      throw new SDKError({
        code: ERROR_CODE.PROVIDER_ERROR,
        message: "provider's account is empty",
      });
    }
    return encodeFunctionData({
      abi: LPBonding,
      functionName: 'stake',
      args: [stakeValue, modeId],
    });
  }

  @Logger('Utils:')
  public async stakePopulateTx(
    props: StakeDepositProps,
  ): Promise<PopulatedTransaction> {
    const { stakeValue, modeId, account } = await this.parseProps(props);
    const data = await this.stakeEncodeData({ stakeValue, modeId });
    const gas = await this.stakeEstimateGas(props, {
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
    props: StakeDepositProps,
  ): Promise<StakeDepositInnerProps> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      stakeValue: parseValue(props.stakeValue),
      callback: props.callback ?? NOOP,
    };
  }
}
