import { BondingTransaction } from '../services/BondService';
import { Decimal } from 'decimal.js';

export interface IStakeMode {
  id: string;
  stake: string;
  vestingPeriod: Decimal;
  dailyInterest: Decimal; // Daily interest rate as percentage
  totalStakingArk: Decimal;
}

export interface TransformedStakingListData {
  id: string;
  stake: string; // Token being staked (ARK)
  periodInDays: Decimal;
  apy: Decimal; // APY as Decimal for calculations
  totalStakedArk: Decimal; // Total staked amount as Decimal
  originalStakeMode: IStakeMode; // Keep reference to original data
}

export interface TransformedMyStakingData {
  id: string;
  title: string; // "Staked ARK"
  period: number; // Period in days for display badge
  capital: Decimal; // Precise capital amount staked using Decimal.js
  reward: Decimal; // Precise total reward amount using Decimal.js
  claimable_reward: Decimal; // Precise claimable reward amount using Decimal.js
  redeemable_capital: {
    value: Decimal | null; // Use Decimal for precise financial calculations
    isLoading: boolean;
    error: string | null;
  };
  maturity_countdown: number; // Time remaining for consistency with bonds
  bondingTransaction: BondingTransaction[];
  isRemain: boolean;
  isFullyClaimed: boolean;
}
