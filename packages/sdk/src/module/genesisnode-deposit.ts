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

import { GenesisNode } from './abi/GenesisNode.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import type {
  GenesisNodeDepositEncodeDataProps,
  GenesisNodeDepositInnerProps,
  GenesisNodeDepositProps,
} from './types.js';

export class ArkSDKGenesisNodeDeposit extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async deposit(
    props: GenesisNodeDepositProps,
  ): Promise<
    TransactionResult<ContractEventArgs<typeof GenesisNode, 'Deposit'>>
  > {
    this.core.useWeb3Provider();
    const {
      callback,
      account,
      depositValue,
      proofs,
      proofMaxDepositAmount,
      ...rest
    } = await this.parseProps(props);

    return this.core.performTransaction({
      ...rest,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.deposit(
          [depositValue, proofs, proofMaxDepositAmount],
          {
            ...options,
          },
        ),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.depositParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async depositSimulateTx(
    props: GenesisNodeDepositProps,
  ): Promise<WriteContractParameters> {
    const { depositValue, proofs, proofMaxDepositAmount, account } =
      await this.parseProps(props);
    const contract = this.getContractGenesisNode();
    const { request } = await contract.simulate.deposit(
      [depositValue, proofs, proofMaxDepositAmount],
      {
        account,
      },
    );

    return request;
  }

  // Utils

  @Logger('Utils:')
  @Cache(30 * 1000, ['core.chain.id'])
  public async depositEstimateGas(
    props: NoTxOptions<GenesisNodeDepositProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const { depositValue, proofs, proofMaxDepositAmount, account } =
      await this.parseProps(props);
    const originalGasLimit =
      await this.getContractGenesisNode().estimateGas.deposit(
        [depositValue, proofs, proofMaxDepositAmount],
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
      | ContractEventArgs<typeof GenesisNode, 'Deposit'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: GenesisNode,
          eventName: 'Deposit',
        })[0] // GenesisNodeDeposit
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: GenesisNode,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'Deposit') {
        depositEvent = parsedLog.args;
      }
    }

    invariant(
      depositEvent,
      'could not find Deposit event in deposit transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return depositEvent;
  }

  @Logger('Utils:')
  private async depositEncodeData(
    props: GenesisNodeDepositEncodeDataProps,
  ): Promise<Hash> {
    const { depositValue, proofs, proofMaxDepositAmount } = props;
    const account = this.core.web3Provider!.account;
    if (!account) {
      throw new SDKError({
        code: ERROR_CODE.PROVIDER_ERROR,
        message: "provider's account is empty",
      });
    }
    return encodeFunctionData({
      abi: GenesisNode,
      functionName: 'deposit',
      args: [depositValue, proofs, proofMaxDepositAmount],
    });
  }

  @Logger('Utils:')
  public async depositPopulateTx(
    props: GenesisNodeDepositProps,
  ): Promise<PopulatedTransaction> {
    const { depositValue, proofs, proofMaxDepositAmount, account } =
      await this.parseProps(props);
    const data = await this.depositEncodeData({
      depositValue,
      proofs,
      proofMaxDepositAmount,
    });
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

  private async parseProps(
    props: GenesisNodeDepositProps,
  ): Promise<GenesisNodeDepositInnerProps> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      depositValue: parseValue(props.depositValue),
      callback: props.callback ?? NOOP,
    };
  }
}
