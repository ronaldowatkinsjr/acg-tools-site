import { type Address } from 'viem';

import { Logger, Cache } from '../common/decorators/index.js';
import { ARK_CONTRACT_NAMES } from '../common/constants.js';

import { AbstractArkSDKErc20 } from './erc20.js';

export class ArkSDK_ArkToken extends AbstractArkSDKErc20 {
  @Logger('Contracts:')
  @Cache(30 * 60 * 1000, ['core.chain.id'])
  public override contractAddress(): Address {
    return this.core.getContractAddress(ARK_CONTRACT_NAMES.ark);
  }
}
