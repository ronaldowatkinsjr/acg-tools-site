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
  StakeClaimEncodeDataProps,
  StakeClaimInnerProps,
  StakeClaimProps,
} from './types.js';

export class ArkSDKStakeClaim extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async stakeClaim(
    props: StakeClaimProps,
  ): Promise<
    TransactionResult<ContractEventArgs<typeof LPBonding, 'StakeClaim'>>
  > {
    this.core.useWeb3Provider();
    const {
      callback,
      account,
      claimAmount,
      signatureTimestamp,
      signature,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      _data,
      ...rest
    } = await this.parseProps(props);

    // await this.validateStakeLimit(claimAmount);
    const contract = this.getContractOlyV3VARKVault();

    return this.core.performTransaction({
      ...rest,
      callback,
      account,
      sendTransaction: (options) =>
        contract.write.withdraw__V3(
          [
            claimAmount,
            signatureTimestamp,
            nfDaoTokenId,
            nftDaoVotingPointsToBurn,
            signature,
            _data,
          ],
          { ...options },
        ),
      decodeResult: async (receipt: TransactionReceipt) =>
        this.stakeClaimParseEvents(receipt),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async stakeClaimSimulateTx(
    props: StakeClaimProps,
  ): Promise<WriteContractParameters> {
    const {
      claimAmount,
      signatureTimestamp,
      signature,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      _data,
      account,
    } = await this.parseProps(props);
    const contract = this.getContractOlyV3VARKVault();
    const { request } = await contract.simulate.withdraw__V3(
      [
        claimAmount,
        signatureTimestamp,
        nfDaoTokenId,
        nftDaoVotingPointsToBurn,
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
  public async stakeClaimEstimateGas(
    props: NoTxOptions<StakeClaimProps>,
    options?: TransactionOptions,
  ): Promise<bigint> {
    const {
      claimAmount,
      signatureTimestamp,
      signature,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      _data,
      account,
    } = await this.parseProps(props);
    const contract = this.getContractOlyV3VARKVault();
    const originalGasLimit = await contract.estimateGas.withdraw__V3(
      [
        claimAmount,
        signatureTimestamp,
        nfDaoTokenId,
        nftDaoVotingPointsToBurn,
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
  private stakeClaimParseEvents(receipt: TransactionReceipt) {
    let stakeClaimEvent:
      | ContractEventArgs<typeof LPBonding, 'StakeClaim'>
      | undefined;

    for (const log of receipt.logs) {
      // skips non-relevant events
      if (
        log.topics[0] !==
        encodeEventTopics({
          abi: LPBonding,
          eventName: 'StakeClaim',
        })[0] // StakeClaim
      )
        continue;

      const parsedLog = decodeEventLog({
        abi: LPBonding,
        strict: true,
        ...log,
      });

      if (parsedLog.eventName === 'StakeClaim') {
        stakeClaimEvent = parsedLog.args;
      }
    }

    invariant(
      stakeClaimEvent,
      'could not find StakeClaim event in deposit transaction',
      ERROR_CODE.TRANSACTION_ERROR,
    );

    return stakeClaimEvent;
  }

  @Logger('Utils:')
  private async stakeClaimEncodeData(
    props: StakeClaimEncodeDataProps,
  ): Promise<Hash> {
    const {
      claimAmount,
      signature,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      signatureTimestamp,
      _data,
    } = props;
    return encodeFunctionData({
      abi: LPBonding,
      functionName: 'claimFromStake',
      args: [
        claimAmount,
        signatureTimestamp,
        nfDaoTokenId,
        nftDaoVotingPointsToBurn,
        signature,
        _data,
      ],
    });
  }

  @Logger('Utils:')
  public async stakeClaimPopulateTx(
    props: StakeClaimProps,
  ): Promise<PopulatedTransaction> {
    const {
      claimAmount,
      signatureTimestamp,
      signature,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      _data,
      account,
    } = await this.parseProps(props);
    const data = await this.stakeClaimEncodeData({
      claimAmount,
      signatureTimestamp,
      signature,
      nfDaoTokenId,
      nftDaoVotingPointsToBurn,
      _data,
    });
    const gas = await this.stakeClaimEstimateGas(props, {
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
    props: StakeClaimProps,
  ): Promise<StakeClaimInnerProps> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      claimAmount: parseValue(props.claimAmount),
      signatureTimestamp: BigInt(props.signatureTimestamp),
      _data: props._data || '',
      callback: props.callback ?? NOOP,
    };
  }
}
