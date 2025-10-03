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
import { ERROR_CODE, invariant, SDKError } from '../common/utils/sdk-error.js';
import {
  type PopulatedTransaction,
  TransactionOptions,
  type TransactionResult,
} from '../core/index.js';
import type { NoTxOptions } from '../core/types.js';

import { DAONft } from './abi/DAONft.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import type {
  DAONftMintBySigEncodeDataProps,
  DAONftMintBySigInnerProps,
  DAONftMintBySigProps,
} from './types.js';

export class ArkSDKDAONftMintBySig extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async mintBySig(
    props: DAONftMintBySigProps,
  ): Promise<TransactionResult<ContractEventArgs<typeof DAONft, 'MintBySig'>>> {
    this.core.useWeb3Provider();
    const { callback, account, waitForTransactionReceiptParameters, ...data } =
      await this.parseProps(props);
    const contract = this.getContractDAONft();
    const hint = await contract.read.getExpiryTrackingHintToMintNft([
      account.address,
      data.expiryTimestamp,
    ]);

    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        contract.write.mintBySig(
          [
            data.votingPoint,
            data.expiryTimestamp,
            hint,
            data.signature,
            data.signatureTimestamp,
            data.mintDeadline,
            data._data,
          ],
          { ...options },
        ),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.mintBySigParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async mintBySigSimulateTx(
    props: DAONftMintBySigProps,
  ): Promise<WriteContractParameters> {
    const { callback, account, waitForTransactionReceiptParameters, ...data } =
      await this.parseProps(props);
    const contract = this.getContractDAONft();
    const hint = await contract.read.getExpiryTrackingHintToMintNft([
      account.address,
      data.expiryTimestamp,
    ]);
    const { request } = await contract.simulate.mintBySig(
      [
        data.votingPoint,
        data.expiryTimestamp,
        hint,
        data.signature,
        data.signatureTimestamp,
        data.mintDeadline,
        data._data,
      ],
      {
        account,
      },
    );

    return request;
  }

  // Utils

  @Logger('Utils:')
  @Cache(30 * 1000, ['core.chain.id'])
  public async mintBySigEstimateGas(
    props: NoTxOptions<DAONftMintBySigProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const { callback, account, waitForTransactionReceiptParameters, ...data } =
      await this.parseProps(props);
    const contract = this.getContractDAONft();
    const hint = await contract.read.getExpiryTrackingHintToMintNft([
      account.address,
      data.expiryTimestamp,
    ]);
    const originalGasLimit = await contract.estimateGas.mintBySig(
      [
        data.votingPoint,
        data.expiryTimestamp,
        hint,
        data.signature,
        data.signatureTimestamp,
        data.mintDeadline,
        data._data,
      ],
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
  private mintBySigParseEvents(receipt: TransactionReceipt) {
    let mintBySigEvent:
      | ContractEventArgs<typeof DAONft, 'MintBySig'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: DAONft,
          eventName: 'MintBySig',
        })[0] // DAONftMintBySiged
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: DAONft,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'MintBySig') {
        mintBySigEvent = parsedLog.args;
      }
    }

    invariant(
      mintBySigEvent,
      'could not find DAONftMintBySiged event in mintBySig transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return mintBySigEvent;
  }

  @Logger('Utils:')
  private async mintBySigEncodeData(
    props: DAONftMintBySigEncodeDataProps,
  ): Promise<Hash> {
    const data = props;
    const account = this.core.web3Provider!.account;
    if (!account) {
      throw new SDKError({
        code: ERROR_CODE.PROVIDER_ERROR,
        message: "provider's account is empty",
      });
    }
    const contract = this.getContractDAONft();
    const hint = await contract.read.getExpiryTrackingHintToMintNft([
      account.address,
      data.expiryTimestamp,
    ]);
    if (!account) {
      throw new SDKError({
        code: ERROR_CODE.PROVIDER_ERROR,
        message: "provider's account is empty",
      });
    }
    return encodeFunctionData({
      abi: DAONft,
      functionName: 'mintBySig',
      args: [
        data.votingPoint,
        data.expiryTimestamp,
        hint,
        data.signature,
        data.signatureTimestamp,
        data.mintDeadline,
        data._data,
      ],
    });
  }

  @Logger('Utils:')
  public async mintBySigPopulateTx(
    props: DAONftMintBySigProps,
  ): Promise<PopulatedTransaction> {
    const { callback, waitForTransactionReceiptParameters, account, ..._data } =
      await this.parseProps(props);
    const data = await this.mintBySigEncodeData(_data);
    const gas = await this.mintBySigEstimateGas(props, {
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
    props: DAONftMintBySigProps,
  ): Promise<DAONftMintBySigInnerProps> {
    return {
      ...props,
      _data: props._data || '',
      account: await this.core.useAccount(props.account),
      callback: props.callback ?? NOOP,
    };
  }
}
