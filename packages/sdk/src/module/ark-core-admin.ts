import {
  ContractFunctionArgs,
  JsonRpcAccount,
  WriteContractParameters,
} from 'viem';
import { NOOP } from '../common/constants.js';
import { ErrorHandler, Logger } from '../common/decorators/index.js';
import { CommonTransactionProps, TransactionResult } from '../core/types.js';

import { ARKCoreGlobalConfig } from './abi/ARKCoreGlobalConfig.js';
import { ArkSDKLPBonding } from './lp-bonding.js';
import {
  ARKCoreAdmin_CreateMode,
  ARKCoreAdmin_DeleteMode,
  ARKCoreAdmin_SetAddressProps,
  ARKCoreAdmin_SetDailySupplyLimit_baseEmissionRate,
  ARKCoreAdmin_SetDailySupplyLimit_minPremium,
  ARKCoreAdmin_SetMaxRedeemBondAllowance,
  ARKCoreAdmin_SetMaxStakeClaimAllowance,
  ARKCoreAdmin_SetMinimumLimitDeposit,
  ARKCoreAdmin_SetMintingCapLimit_buffer,
  ARKCoreAdmin_SetMode,
  ARKCoreAdmin_SetRCMRatio,
} from './types.js';

export class ArkSDKARKCoreAdmin extends ArkSDKLPBonding {
  // Precomputed event signatures

  // Calls

  @Logger('Call:')
  @ErrorHandler()
  public async setAddressConfig(
    props: ARKCoreAdmin_SetAddressProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      newAddress,
      setAddressFunction,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } = await this.getContractARKCoreGlobalConfig().simulate[
      setAddressFunction
    ]([newAddress], { account });

    if (simulateOnly != undefined && simulateOnly == true) {
      return request;
    }

    // send tx
    return this.core.performTransaction({
      waitForTransactionReceiptParameters,
      callback,
      account,
      sendTransaction: (options) =>
        this.getContractARKCoreGlobalConfig().write[setAddressFunction](
          [newAddress],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setDailySupplyLimit(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setDailySupplyLimit({
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
        this.getContractARKCoreGlobalConfig().write.setDailySupplyLimit({
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setDailySupplyLimit_baseEmissionRate(
    props: ARKCoreAdmin_SetDailySupplyLimit_baseEmissionRate,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      baseEmissionRate,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setDailySupplyLimit_baseEmissionRate(
        [baseEmissionRate],
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
        this.getContractARKCoreGlobalConfig().write.setDailySupplyLimit_baseEmissionRate(
          [baseEmissionRate],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setDailySupplyLimit_minPremium(
    props: ARKCoreAdmin_SetDailySupplyLimit_minPremium,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      minPremium,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setDailySupplyLimit_minPremium(
        [minPremium],
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
        this.getContractARKCoreGlobalConfig().write.setDailySupplyLimit_minPremium(
          [minPremium],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setMaxRedeemBondAllowance(
    props: ARKCoreAdmin_SetMaxRedeemBondAllowance,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      maxRedeemBondAllowance,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setMaxRedeemBondAllowance(
        [maxRedeemBondAllowance],
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
        this.getContractARKCoreGlobalConfig().write.setMaxRedeemBondAllowance(
          [maxRedeemBondAllowance],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setMaxStakeClaimAllowance(
    props: ARKCoreAdmin_SetMaxStakeClaimAllowance,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      maxStakeClaimAllowance,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setMaxStakeClaimAllowance(
        [maxStakeClaimAllowance],
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
        this.getContractARKCoreGlobalConfig().write.setMaxStakeClaimAllowance(
          [maxStakeClaimAllowance],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setMintingCapLimit_buffer(
    props: ARKCoreAdmin_SetMintingCapLimit_buffer,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      mintingCapLimit_buffer,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setMintingCapLimit_buffer(
        [mintingCapLimit_buffer],
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
        this.getContractARKCoreGlobalConfig().write.setMintingCapLimit_buffer(
          [mintingCapLimit_buffer],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setMinimumLimitDeposit(
    props: ARKCoreAdmin_SetMinimumLimitDeposit,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      minimumLimitDeposit,
    } = await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setMinimumLimitDeposit(
        [minimumLimitDeposit],
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
        this.getContractARKCoreGlobalConfig().write.setMinimumLimitDeposit(
          [minimumLimitDeposit],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setRCMRandomMultiplier(
    props: ARKCoreAdmin_SetRCMRatio,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters, rcmRatio } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setRCMRandomMultiplier(
        [rcmRatio],
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
        this.getContractARKCoreGlobalConfig().write.setRCMRandomMultiplier(
          [rcmRatio],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setRCMRandomRangeMax(
    props: ARKCoreAdmin_SetRCMRatio,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters, rcmRatio } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setRCMRandomRangeMax(
        [rcmRatio],
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
        this.getContractARKCoreGlobalConfig().write.setRCMRandomRangeMax(
          [rcmRatio],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setRCMRandomRangeMin(
    props: ARKCoreAdmin_SetRCMRatio,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters, rcmRatio } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setRCMRandomRangeMin(
        [rcmRatio],
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
        this.getContractARKCoreGlobalConfig().write.setRCMRandomRangeMin(
          [rcmRatio],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setRCMBufferMultiplier(
    props: ARKCoreAdmin_SetRCMRatio,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters, rcmRatio } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setRCMBufferMultiplier(
        [rcmRatio],
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
        this.getContractARKCoreGlobalConfig().write.setRCMBufferMultiplier(
          [rcmRatio],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async createMode(
    props: ARKCoreAdmin_CreateMode,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters, ...mode } =
      await this.parseTxProps(props);

    const param: ContractFunctionArgs<
      typeof ARKCoreGlobalConfig,
      'nonpayable',
      'createMode'
    > = [
      mode.vestingPeriod,
      mode.discountRate,
      mode.interestRate,
      mode.daoNftVotingPowerMultiplier,
    ];

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.createMode(param, {
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
        this.getContractARKCoreGlobalConfig().write.createMode(param, {
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async deleteMode(
    props: ARKCoreAdmin_DeleteMode,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters, modeId } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.deleteMode(
        [modeId],
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
        this.getContractARKCoreGlobalConfig().write.deleteMode([modeId], {
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async setMode(
    props: ARKCoreAdmin_SetMode,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const {
      callback,
      account,
      waitForTransactionReceiptParameters,
      modeId,
      ...configProps
    } = await this.parseTxProps(props);

    // parse config props
    const currentConfig = await this.getContractLPBonding().read.getMode([
      modeId,
    ]);
    const parsedConfig = Object.fromEntries(
      Object.entries(currentConfig).map(([k, v]) => [
        k,
        configProps[k as keyof typeof currentConfig] != undefined
          ? configProps[k as keyof typeof configProps]
          : v,
      ]),
    ) as typeof currentConfig;

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.setMode(
        [modeId, parsedConfig],
        {
          account,
        },
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
        this.getContractARKCoreGlobalConfig().write.setMode(
          [modeId, parsedConfig],
          {
            ...options,
          },
        ),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async pauseBonding(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.pauseBonding({
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
        this.getContractARKCoreGlobalConfig().write.pauseBonding({
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async unpauseBonding(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.unpauseBonding({
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
        this.getContractARKCoreGlobalConfig().write.unpauseBonding({
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async pauseStaking(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.pauseStaking({
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
        this.getContractARKCoreGlobalConfig().write.pauseStaking({
          ...options,
        }),
    });
  }

  @Logger('Call:')
  @ErrorHandler()
  public async unpauseStaking(
    props: CommonTransactionProps,
    simulateOnly = false,
  ): Promise<WriteContractParameters | TransactionResult> {
    this.core.useWeb3Provider();
    // parse tx props
    const { callback, account, waitForTransactionReceiptParameters } =
      await this.parseTxProps(props);

    // simulate tx
    const { request } =
      await this.getContractARKCoreGlobalConfig().simulate.unpauseStaking({
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
        this.getContractARKCoreGlobalConfig().write.unpauseStaking({
          ...options,
        }),
    });
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
