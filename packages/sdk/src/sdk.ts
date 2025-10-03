import { ArkSDKCore, ArkSDKCoreProps } from './core/index.js';
import { ArkSDK_ArkToken } from './erc20/ark.js';
import { ArkSDK_BETH } from './erc20/beth.js';
import { ArkSDK_USDT } from './erc20/usdt.js';
import { ArkSDKARKCoreAdmin } from './module/ark-core-admin.js';
import { ArkSDKBondDeposit } from './module/bond-deposit.js';
import { ArkSDKBondRedeem } from './module/bond-redeem.js';
import { ArkSDKDAONftMintBySig } from './module/dao-nft-mintbysig.js';
import { ArkSDKGenesisNodeAdmin } from './module/genesisnode-admin.js';
import { ArkSDKGenesisNodeDeposit } from './module/genesisnode-deposit.js';
import { ArkSDKRewardVestingClaim } from './module/rewardvesting-claim.js';
import { ArkSDKRewardVestingDelayedRewardClaim } from './module/rewardvesting-delayedreward-claim.js';
import { ArkSDKRewardVestingRegister } from './module/rewardvesting-register.js';
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
  readonly rewardVestingRegister: ArkSDKRewardVestingRegister;
  readonly rewardVestingClaim: ArkSDKRewardVestingClaim;
  readonly rewardVestingDelayedRewardClaim: ArkSDKRewardVestingDelayedRewardClaim;
  readonly views: ArkSDKLPBonding_Views;
  readonly ark: ArkSDK_ArkToken;
  readonly usdt: ArkSDK_USDT;
  readonly bETH: ArkSDK_BETH;
  readonly genesisNode: ArkSDKGenesisNodeDeposit;
  readonly daoNft: ArkSDKDAONftMintBySig;
  readonly genesisNodeAdmin: ArkSDKGenesisNodeAdmin;
  readonly arkCoreAdmin: ArkSDKARKCoreAdmin;

  constructor(props: ArkSDKCoreProps) {
    // Core functionality
    this.core = new ArkSDKCore(props, version);
    const core = this.core;
    // Bond functionality
    this.bondDeposit = new ArkSDKBondDeposit({ ...props, core });
    this.bondRedeem = new ArkSDKBondRedeem({ ...props, core });
    this.arkCoreAdmin = new ArkSDKARKCoreAdmin({ ...props, core });
    // Staking functionality
    this.stakeDeposit = new ArkSDKStakeDeposit({ ...props, core });
    this.stakeClaim = new ArkSDKStakeClaim({ ...props, core });
    // Reward vesting functionality
    this.rewardVestingRegister = new ArkSDKRewardVestingRegister({
      ...props,
      core,
    });
    this.rewardVestingClaim = new ArkSDKRewardVestingClaim({ ...props, core });
    this.rewardVestingDelayedRewardClaim =
      new ArkSDKRewardVestingDelayedRewardClaim({ ...props, core });
    // Genesis Node functionality
    this.genesisNode = new ArkSDKGenesisNodeDeposit({
      ...props,
      core,
    });
    this.genesisNodeAdmin = new ArkSDKGenesisNodeAdmin({
      ...props,
      core,
    });
    // DAO Nft functionality
    this.daoNft = new ArkSDKDAONftMintBySig({ ...props, core });
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
