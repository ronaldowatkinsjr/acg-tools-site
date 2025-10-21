import { ArkSDKCore, ArkSDKCoreProps } from './core/index.js';
import { ArkSDK_ArkToken } from './erc20/ark.js';
import { ArkSDK_BETH } from './erc20/beth.js';
import { ArkSDK_USDT } from './erc20/usdt.js';
import { ArkSDKBondDeposit } from './module/bond-deposit.js';
import { ArkSDKBondRedeem } from './module/bond-redeem.js';
import { ArkSDKStakeClaim } from './module/stake-claim.js';
import { ArkSDKStakeDeposit } from './module/stake-deposit.js';
import { ArkSDKLPBonding_Views } from './module/views.js';
import { version } from './version.js';

export class ArkSDK {
  readonly core: ArkSDKCore;
  readonly bondDeposit: ArkSDKBondDeposit;
  readonly bondRedeem: ArkSDKBondRedeem;
  readonly stakeDeposit: ArkSDKStakeDeposit;
  readonly stakeClaim: ArkSDKStakeClaim;
  readonly views: ArkSDKLPBonding_Views;
  readonly ark: ArkSDK_ArkToken;
  readonly usdt: ArkSDK_USDT;
  readonly bETH: ArkSDK_BETH;

  constructor(props: ArkSDKCoreProps) {
    // Core functionality
    this.core = new ArkSDKCore(props, version);
    const core = this.core;
    // Bond functionality
    this.bondDeposit = new ArkSDKBondDeposit({ ...props, core });
    this.bondRedeem = new ArkSDKBondRedeem({ ...props, core });
    // Staking functionality
    this.stakeDeposit = new ArkSDKStakeDeposit({ ...props, core });
    this.stakeClaim = new ArkSDKStakeClaim({ ...props, core });
    // DAO Nft functionality
    // views
    this.views = new ArkSDKLPBonding_Views({ ...props, core });
    // ARK token
    this.ark = new ArkSDK_ArkToken({ ...props, core });
    // USDT token
    this.usdt = new ArkSDK_USDT({ ...props, core });
    // Binance-Peg ETH token
    this.bETH = new ArkSDK_BETH({ ...props, core });
  }
}
