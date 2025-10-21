import { getAddress, getContract } from 'viem';

import type {
  Address,
  GetContractReturnType,
  PublicClient,
  WalletClient,
} from 'viem';

import { ARK_CONTRACT_NAMES } from '../common/constants.js';
import { Cache, Logger } from '../common/decorators/index.js';

import { StandardMerkleTree } from '@openzeppelin/merkle-tree';
import { ArkSDKModule } from '../common/class-primitives/sdk-module.js';
import { ARKCoreGlobalConfig } from './abi/ARKCoreGlobalConfig.js';
import { DAONft } from './abi/DAONft.js';
import { GenesisNode } from './abi/GenesisNode.js';
import { INonfungiblePositionManager } from './abi/INonfungiblePositionManager.js';
import { IRouterV2 } from './abi/IRouterV2.js';
import { LPBonding } from './abi/LPBonding.js';
import { OlyV3_BondFixedTermTeller } from './abi/OlyV3_BondFixedTermTeller.js';
import { OlyV3_Operator } from './abi/OlyV3_Operator.js';
import { OlyV3_VARKVault } from './abi/OlyV3_VARKVault.js';
import { RewardVesting } from './abi/RewardVesting.js';
import { V3Pool } from './abi/V3Pool.js';
import { GenesisNodeWhitelistParam } from './types.js';

export class ArkSDKLPBonding extends ArkSDKModule {
  @Logger('Contracts:')
  public contractAddressLPBonding(): Address {
    return this.core.getContractAddress(ARK_CONTRACT_NAMES.lpBonding);
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractLPBonding(): GetContractReturnType<
    typeof LPBonding,
    WalletClient
  > {
    const address = this.contractAddressLPBonding();

    return getContract({
      address,
      abi: LPBonding,
      client: {
        public: this.core.rpcProvider,
        wallet: this.core.web3Provider as WalletClient,
      },
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractRouterV2(): GetContractReturnType<
    typeof IRouterV2,
    PublicClient
  > {
    const address = this.core.getContractAddress(ARK_CONTRACT_NAMES.routerV2);

    return getContract({
      address,
      abi: IRouterV2,
      client: this.core.rpcProvider,
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractV2Pool(): GetContractReturnType<
    typeof V3Pool,
    PublicClient
  > {
    const address = this.core.getContractAddress(ARK_CONTRACT_NAMES.V2Pool);

    return getContract({
      address,
      abi: V3Pool,
      client: this.core.rpcProvider,
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractLPNftManager(): GetContractReturnType<
    typeof INonfungiblePositionManager,
    PublicClient
  > {
    const address = this.core.getContractAddress(
      ARK_CONTRACT_NAMES.LPNftPosManager,
    );

    return getContract({
      address,
      abi: INonfungiblePositionManager,
      client: this.core.rpcProvider,
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractRewardVesting(): GetContractReturnType<
    typeof RewardVesting,
    WalletClient
  > {
    const address = this.core.getContractAddress(
      ARK_CONTRACT_NAMES.rewardVesting,
    );

    return getContract({
      address,
      abi: RewardVesting,
      client: {
        public: this.core.rpcProvider,
        wallet: this.core.web3Provider as WalletClient,
      },
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractGenesisNode(): GetContractReturnType<
    typeof GenesisNode,
    WalletClient
  > {
    const address = this.core.getContractAddress(
      ARK_CONTRACT_NAMES.genesisNode,
    );

    return getContract({
      address,
      abi: GenesisNode,
      client: {
        public: this.core.rpcProvider,
        wallet: this.core.web3Provider as WalletClient,
      },
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractDAONft(): GetContractReturnType<
    typeof DAONft,
    WalletClient
  > {
    const address = this.core.getContractAddress(ARK_CONTRACT_NAMES.daoNft);

    return getContract({
      address,
      abi: DAONft,
      client: {
        public: this.core.rpcProvider,
        wallet: this.core.web3Provider as WalletClient,
      },
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractOlyV3Operator(): GetContractReturnType<
    typeof OlyV3_Operator,
    WalletClient
  > {
    const address = this.core.getContractAddress(
      ARK_CONTRACT_NAMES.olyV3_Operator,
    );

    return getContract({
      address,
      abi: OlyV3_Operator,
      client: {
        public: this.core.rpcProvider,
        wallet: this.core.web3Provider as WalletClient,
      },
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractOlyV3BondFixedTermTeller(): GetContractReturnType<
    typeof OlyV3_BondFixedTermTeller,
    WalletClient
  > {
    const address = this.core.getContractAddress(
      ARK_CONTRACT_NAMES.olyV3_BondFixedTermTeller,
    );

    return getContract({
      address,
      abi: OlyV3_BondFixedTermTeller,
      client: {
        public: this.core.rpcProvider,
        wallet: this.core.web3Provider as WalletClient,
      },
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractOlyV3VARKVault(): GetContractReturnType<
    typeof OlyV3_VARKVault,
    WalletClient
  > {
    const address = this.core.getContractAddress(
      ARK_CONTRACT_NAMES.olyV3_VARKVault,
    );

    return getContract({
      address,
      abi: OlyV3_VARKVault,
      client: {
        public: this.core.rpcProvider,
        wallet: this.core.web3Provider as WalletClient,
      },
    });
  }

  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public getContractARKCoreGlobalConfig(): GetContractReturnType<
    typeof ARKCoreGlobalConfig,
    WalletClient
  > {
    const address = this.contractAddressLPBonding();

    return getContract({
      address,
      abi: ARKCoreGlobalConfig,
      client: {
        public: this.core.rpcProvider,
        wallet: this.core.web3Provider as WalletClient,
      },
    });
  }
  // utils

  @Logger('Utils:')
  public async prepareNftMintHint(userAddress: Address, modeId: bigint) {
    // fetch hint
    const hint = await this.getContractLPBonding().read.getHintToMintDAONft([
      userAddress,
      modeId,
    ]);

    return hint;
  }

  @Logger('Utils:')
  public buildMerkleTreeFromGenesisNodeWhitelist(
    lstWhitelist: GenesisNodeWhitelistParam[],
  ) {
    // build whitelist root from merkle tree
    return StandardMerkleTree.of(
      lstWhitelist.map(({ userAddress, maxDepositAmount }) => [
        getAddress(userAddress),
        maxDepositAmount,
      ]),
      ['address', 'uint256'],
    );
  }
}
