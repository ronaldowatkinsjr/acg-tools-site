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
import { ERROR_CODE, invariant } from '../common/utils/sdk-error.js';
import {
  type PopulatedTransaction,
  TransactionOptions,
  type TransactionResult,
} from '../core/index.js';
import type { NoTxOptions } from '../core/types.js';

import { LPBonding } from './abi/LPBonding.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import type {
  BondRedeemEncodeDataProps,
  BondRedeemInnerProps,
  BondRedeemProps,
} from './types.js';

export class ArkSDKBondRedeem extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async redeemBond(
    props: BondRedeemProps,
  ): Promise<
    TransactionResult<ContractEventArgs<typeof LPBonding, 'BondsRedeemed'>>
  > {
    this.core.useWeb3Provider();
    const {
      callback,
      account,
      redeemBondAmount,
      signatureTimestamp,
      signature,
      _data,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      ...rest
    } = await this.parseProps(props);

    // await this.validateStakeLimit(redeemBondAmount);
    const contract = this.getContractOlyV3BondFixedTermTeller();

    return this.core.performTransaction({
      ...rest,
      callback,
      account,
      sendTransaction: (options) =>
        contract.write.redeem__V3(
          [
            {
              claimAmount: redeemBondAmount,
              timestamp: signatureTimestamp,
              nfDaoTokenId,
              nftDaoVotingPointsToBurn,
            },
            signature,
            _data,
          ],
          { ...options },
        ),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.redeemBondParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async redeemBondSimulateTx(
    props: BondRedeemProps,
  ): Promise<WriteContractParameters> {
    const {
      redeemBondAmount,
      signatureTimestamp,
      signature,
      _data,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      account,
    } = await this.parseProps(props);
    const contract = this.getContractOlyV3BondFixedTermTeller();
    const { request } = await contract.simulate.redeem__V3(
      [
        {
          claimAmount: redeemBondAmount,
          timestamp: signatureTimestamp,
          nfDaoTokenId,
          nftDaoVotingPointsToBurn,
        },
        signature,
        _data,
      ],
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
  public async redeemBondEstimateGas(
    props: NoTxOptions<BondRedeemProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const {
      redeemBondAmount,
      signatureTimestamp,
      signature,
      _data,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      account,
    } = await this.parseProps(props);
    const contract = this.getContractOlyV3BondFixedTermTeller();
    const originalGasLimit = await contract.estimateGas.redeem__V3(
      [
        {
          claimAmount: redeemBondAmount,
          timestamp: signatureTimestamp,
          nfDaoTokenId,
          nftDaoVotingPointsToBurn,
        },
        signature,
        _data,
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
  private redeemBondParseEvents(receipt: TransactionReceipt) {
    let redeemBondEvent:
      | ContractEventArgs<typeof LPBonding, 'BondsRedeemed'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: LPBonding,
          eventName: 'BondsRedeemed',
        })[0] // BondsRedeemed
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: LPBonding,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'BondsRedeemed') {
        redeemBondEvent = parsedLog.args;
      }
    }

    invariant(
      redeemBondEvent,
      'could not find BondsRedeemed event in deposit transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return redeemBondEvent;
  }

  @Logger('Utils:')
  private async redeemBondEncodeData(
    props: BondRedeemEncodeDataProps,
  ): Promise<Hash> {
    const {
      redeemBondAmount,
      signature,
      signatureTimestamp,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      _data,
    } = props;
    return encodeFunctionData({
      abi: LPBonding,
      functionName: 'redeemBond',
      args: [
        {
          claimAmount: redeemBondAmount,
          timestamp: signatureTimestamp,
          nfDaoTokenId,
          nftDaoVotingPointsToBurn,
        },
        signature,
        _data,
      ],
    });
  }

  @Logger('Utils:')
  public async redeemBondPopulateTx(
    props: BondRedeemProps,
  ): Promise<PopulatedTransaction> {
    const {
      redeemBondAmount,
      signatureTimestamp,
      signature,
      _data,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      account,
    } = await this.parseProps(props);
    const data = await this.redeemBondEncodeData({
      redeemBondAmount,
      signatureTimestamp,
      signature,
      _data,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
    });
    const gas = await this.redeemBondEstimateGas(props, {
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
  public async preparePancakeswapParams(): Promise<void> {}

  private async parseProps(
    props: BondRedeemProps,
  ): Promise<BondRedeemInnerProps> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      redeemBondAmount: parseValue(props.redeemBondAmount),
      signatureTimestamp: BigInt(props.signatureTimestamp),
      _data: props._data || '',
      nfDaoTokenId: BigInt(props.nfDaoTokenId),
      nftDaoVotingPointsToBurn: BigInt(props.nftDaoVotingPointsToBurn),
      callback: props.callback ?? NOOP,
    };
  }
}
