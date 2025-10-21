import {
  BondingTransaction,
  BondingTransactionType,
} from '../services/BondService';
import { Decimal } from 'decimal.js';

export interface IBondMode {
  id: string;
  bond: string;
  discountRate: Decimal;
  dailyInterest: Decimal;
  vestingPeriod: Decimal;
  totalLpBondedArk: Decimal;
}

export interface TransformedBondData {
  id: string;
  title: string;
  period: number;
  capital: Decimal; // Precise capital amount using Decimal.js
  reward: Decimal; // Precise total reward amount using Decimal.js
  claimable_reward: Decimal; // Precise claimable reward amount using Decimal.js
  redeemable_capital: {
    value: Decimal | null; // Use Decimal for precise financial calculations
    isLoading: boolean;
    error: string | null;
  };
  maturity_countdown: number;
  bondingTransaction: BondingTransaction[];
  isRemain: boolean;
  isFullyClaimed: boolean;
}

export interface TransformedBondListingData {
  id: string;
  bond: string;
  periodInDays: Decimal;
  bondPrice: Decimal;
  discountRate: Decimal;
  dailyInterest: Decimal;
  apy: Decimal;
  purchasedBond: Decimal;
  originalBond: IBondMode; // Keep reference to original data
}

export interface TransformedBondHistoryData {
  id: string;
  datetime: string;
  action: string;
  actionDetails: string;
  txId: string;
  totalArk: string;
  periodInDays: number;
  type: BondingTransactionType;
}

export interface TransformedRebasingHistoryData {
  id: string;
  datetime: string;
  currentAsset: string;
  currentReward: string;
  bondingStatusId: string;
}
