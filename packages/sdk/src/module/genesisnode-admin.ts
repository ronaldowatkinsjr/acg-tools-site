import {
  encodeFunctionData,
  getAddress,
  Hash,
  Hex,
  JsonRpcAccount,
  WriteContractParameters,
} from 'viem';
import { NOOP } from '../common/constants.js';
import { ErrorHandler, Logger } from '../common/decorators/index.js';
import {
  CommonTransactionProps,
  PopulatedTransaction,
  TransactionResult,
} from '../core/types.js';

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { GenesisNode } from './abi/GenesisNode.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import type {
  GenesisNodeAdmin_SetMaxLimitTotalDepositorProps,
  GenesisNodeAdmin_SetMaxLimitTotalDepositProps,
  GenesisNodeAdmin_SetMinDepositLimitProps,
  GenesisNodeAdmin_SetStepToNormalizeDepositProps,
  GenesisNodeAdmin_SetTreasuryAddressProps,
  GenesisNodeAdmin_SetWhitelistProps,
} from './types.js';

export class ArkSDKGenesisNodeAdmin extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async setMinDepositLimit(
    props: GenesisNodeAdmin_SetMinDepositLimitProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      minDepositLimit,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractGenesisNode().simulate.setMinDepositLimit(
        [minDepositLimit],
        { account },
      );

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.setMinDepositLimit(
          [minDepositLimit],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setMaxLimitTotalDeposit(
    props: GenesisNodeAdmin_SetMaxLimitTotalDepositProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      maxLimitTotalDeposit,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractGenesisNode().simulate.setMaxLimitTotalDeposit(
        [maxLimitTotalDeposit],
        { account },
      );

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.setMaxLimitTotalDeposit(
          [maxLimitTotalDeposit],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setStepToNormalizeDeposit(
    props: GenesisNodeAdmin_SetStepToNormalizeDepositProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      stepAmountToNormalize,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractGenesisNode().simulate.setStepToNormalizeDeposit(
        [stepAmountToNormalize],
        { account },
      );

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.setStepToNormalizeDeposit(
          [stepAmountToNormalize],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setMaxLimitTotalDepositor(
    props: GenesisNodeAdmin_SetMaxLimitTotalDepositorProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      maxLimitTotalDepositor,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractGenesisNode().simulate.setMaxLimitTotalDepositor(
        [maxLimitTotalDepositor],
        { account },
      );

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.setMaxLimitTotalDepositor(
          [maxLimitTotalDepositor],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setTreasuryAddress(
    props: GenesisNodeAdmin_SetTreasuryAddressProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      treasuryAddress,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractGenesisNode().simulate.setTreasuryAddress(
        [treasuryAddress],
        { account },
      );

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.setTreasuryAddress(
          [treasuryAddress],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async resume(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } = await this.getContractGenesisNode().simulate.resume({
      account,
    });

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.resume({
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async close(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } = await this.getContractGenesisNode().simulate.close({
      account,
    });

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.close({
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async pause(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } = await this.getContractGenesisNode().simulate.pause({
      account,
    });

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.pause({
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async unpause(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } = await this.getContractGenesisNode().simulate.unpause({
      account,
    });

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.unpause({
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setWhitelist(
    props: GenesisNodeAdmin_SetWhitelistProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      lstWhitelist,
    } = await this.parseTxProps(props);

    // build whitelist root from merkle tree
    const whitelist = this.buildMerkleTreeFromGenesisNodeWhitelist(lstWhitelist)
      .root as Hex;

    // simulate tx
    const { request } =
      await this.getContractGenesisNode().simulate.setWhitelist([whitelist], {
        account,
      });

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractGenesisNode().write.setWhitelist([whitelist], {
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setWhitelistPopulateTX(
    props: GenesisNodeAdmin_SetWhitelistProps,
  ): Promise<Omit<PopulatedTransaction, 'data'> & { data: Hash }> {
    this.core.useWeb3Provider();
    // parse tx props
    const { account, lstWhitelist } = await this.parseTxProps(props);

    // build whitelist root from merkle tree
    const whitelist = StandardMerkleTree.of(
      lstWhitelist.map(({ userAddress, maxDepositAmount }) => [
        getAddress(userAddress),
        maxDepositAmount,
      ]),
      ['address', 'uint256'],
    ).root as Hex;

    // encode data
    const data = encodeFunctionData({
      abi: GenesisNode,
      functionName: 'setWhitelist',
      args: [whitelist],
    });

    return {
      to: this.getContractGenesisNode().address,
      from: account.address,
      data,
    };
  }

  private async parseTxProps<T extends CommonTransactionProps>(
    props: T,
  ): Promise<Omit<T, 'account'> & { account: JsonRpcAccount }> {
    return {
      ...props,
      account: await this.core.useAccount(props.account),
      callback: props.callback ?? NOOP,
    };
  }
}
