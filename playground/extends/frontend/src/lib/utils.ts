import { Decimal } from 'decimal.js';
import { decimalLessThanOrEqual, toDecimal } from './decimal-utils';

export const formatAddress = (address: string, by = 5) => {
  if (address.length <= 10) return address;

  return `${address.slice(0, by)}...${address.slice(-by)}`;
};

export function parseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    // Check if the object has a message property
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }

    // Check if the object has a toString method that's not the default
    if ('toString' in error && typeof error.toString === 'function') {
      const stringified = error.toString();
      if (stringified !== '[object Object]') {
        return stringified;
      }
    }

    // Try to stringify the object for debugging purposes
    try {
      const jsonString = JSON.stringify(error, null, 2);
      // If it's a small object, return it formatted
      if (jsonString.length < 200) {
        return `Error details: ${jsonString}`;
      }
      // For larger objects, truncate
      return `Error details: ${jsonString.substring(0, 200)}...`;
    } catch (error) {
      // If JSON.stringify fails, return a generic message
      // return 'An unexpected error occurred (unable to parse error details)';
      throw error;
    }
  }

  if (error === null || error === undefined) {
    return 'An unexpected error occurred';
  }

  // Fallback for any other type
  return String(error);
}

export const formatCurrency = (
  value: string | Decimal,
  currency = 'USD',
  locale = 'en-US',
): string => {
  const numericValue =
    typeof value === 'string' ? Number.parseFloat(value) : value.toNumber();
  if (Number.isNaN(numericValue)) {
    return '';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

export const formatAmount = (
  value: Decimal | string,
  locale = 'en-US',
): string => {
  const numericValue =
    typeof value === 'string' ? Number.parseFloat(value) : value.toNumber();
  if (Number.isNaN(numericValue)) {
    return '';
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

export const formatExplorerLink = (
  address: string,
  type: 'address' | 'tx' = 'tx',
  chainId: string = '1',
): string => {
  let baseUrl = '';
  switch (chainId) {
    case '1': // Ethereum Mainnet
      baseUrl = 'https://etherscan.io';
      break;
    case '56': // Binance Smart Chain
      baseUrl = 'https://bscscan.com';
      break;
    case '97': // Binance Smart Chain Testnet
      baseUrl = 'https://testnet.bscscan.com';
      break;
  }
  return `${baseUrl}/${type}/${address}`;
};

/**
 * Input formatting system - formats user input with decimal limits
 */
export const formatInputWithDecimalLimit = (
  value: string,
  maxDecimals = 18,
): string => {
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');

  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit decimal places
  if (parts.length === 2 && parts[1].length > maxDecimals) {
    return parts[0] + '.' + parts[1].substring(0, maxDecimals);
  }

  return cleaned;
};

/**
 * Display formatting system - formats numbers with currency symbols for UI display only
 * NOTE: This is ONLY for display, not for calculations.
 */
export const formatCoinDisplay = (
  value: string | Decimal,
  coinSymbol = 'ARK',
  displayDecimals = 6,
  locale = 'en-US',
): string => {
  // Handle Decimal objects properly to preserve precision during formatting
  let numericValue: number;

  if (value instanceof Decimal) {
    numericValue = value.toNumber();
  } else {
    numericValue = typeof value === 'string' ? Number.parseFloat(value) : value;
  }

  return (
    new Intl.NumberFormat(locale, {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: 0,
      maximumFractionDigits: displayDecimals,
    }).format(numericValue) + ` ${coinSymbol}`
  );
};

/**
 * Unified claim validation utility to replace redundant implementations
 */
export const createClaimValidator = (
  bondData: {
    redeemable_capital?: {
      value: Decimal | null;
      isLoading?: boolean;
      error?: string | null;
    };
    claimable_reward: Decimal;
    hasAbandonedRedeem?: boolean;
    hasAbandonedClaim?: boolean;
  },
  isProcessing: boolean,
  claimType: 'capital' | 'reward',
): boolean => {
  if (claimType === 'capital') {
    // If there are abandoned redeem signatures, keep button enabled regardless of amount
    if (bondData.hasAbandonedRedeem) {
      return Boolean(
        isProcessing ||
          bondData.redeemable_capital?.isLoading ||
          bondData.redeemable_capital?.error,
      );
    }

    // Default validation when no abandoned signatures - use Decimal value comparison
    return Boolean(
      isProcessing ||
        !bondData.redeemable_capital?.value ||
        decimalLessThanOrEqual(bondData.redeemable_capital.value, 0) ||
        bondData.redeemable_capital?.isLoading ||
        bondData.redeemable_capital?.error,
    );
  } else {
    // If there are abandoned claim signatures, keep button enabled regardless of amount
    if (bondData.hasAbandonedClaim) {
      return Boolean(isProcessing);
    }

    // Default validation when no abandoned signatures - use exact value comparison
    return Boolean(
      isProcessing || decimalLessThanOrEqual(bondData.claimable_reward, 0),
    );
  }
};

export const createStakeClaimValidator = (
  stakeData: {
    unstakable_capital?: {
      value: Decimal | null;
      isLoading?: boolean;
      error?: string | null;
    };
    claimable_reward: Decimal;
    hasAbandonedRedeem?: boolean;
    hasAbandonedClaim?: boolean;
  },
  isProcessing: boolean,
  claimType: 'claim' | 'unstake',
): boolean => {
  if (claimType === 'unstake') {
    // If there are abandoned redeem signatures, keep button enabled regardless of amount
    if (stakeData.hasAbandonedRedeem) {
      return Boolean(
        isProcessing ||
          stakeData.unstakable_capital?.isLoading ||
          stakeData.unstakable_capital?.error,
      );
    }
    // Default validation when no abandoned signatures
    return Boolean(
      isProcessing ||
        !stakeData.unstakable_capital?.value ||
        decimalLessThanOrEqual(stakeData.unstakable_capital.value, 0) ||
        stakeData.unstakable_capital?.isLoading ||
        stakeData.unstakable_capital?.error,
    );
  } else {
    // If there are abandoned claim signatures, keep button enabled regardless of amount
    if (stakeData.hasAbandonedClaim) {
      return Boolean(isProcessing);
    }
    // Default validation when no abandoned signatures
    return Boolean(
      isProcessing || decimalLessThanOrEqual(stakeData.claimable_reward, 0),
    );
  }
};

/**
 * Check if bond/stake is fully claimed using exact values
 * Returns true if both claimable reward and redeemable principal are <= 0 AND vesting ended
 */
export const isFullyClaimed = (
  claimableReward: Decimal,
  redeemablePrincipal: string | null,
  createdAt: string,
  periodInDays: Decimal,
): boolean => {
  const now = new Date().getTime();
  const createdDate = new Date(createdAt);

  // if the vesting period is 0 days, it actually have a 12 hours rebasing once
  // and the BondingStatus.createdDate is in UTC+0
  // so first convert it to UTC+8,
  // if the converted datetime is within the last 12 hours, then it is not ended yet
  const utc8Offset = 8 * 60 * 60 * 1000; // UTC+8 in milliseconds
  const last12Hours = Date.now() - 12 * 60 * 60 * 1000; // Last 12 hours in milliseconds
  if (createdDate.getTime() + utc8Offset > last12Hours) {
    createdDate.setHours(createdDate.getHours() + 12);
  }

  const vestingPeriodMs = periodInDays.mul(24 * 60 * 60 * 1000);
  const vestingEndDate = vestingPeriodMs.plus(createdDate.getTime());

  // Check if vesting period has ended
  const vestingEnded = now > vestingEndDate.toNumber();

  if (!vestingEnded) {
    return false;
  }

  // Use exact values - no truncation
  const principalAmount = toDecimal(redeemablePrincipal || 0);

  return claimableReward.lte(0) && principalAmount.lte(0);
};

/**
 * Format decimal values with special handling for very small numbers
 * - Regular decimals: 1.245511 -> 1.246
 * - Large numbers: 23456.772 -> 23,456.77
 * - Small values: 0.00002134 -> { prefix: "0.0", subscript: "4", suffix: "2134" }
 */
export const formatDecimalWithSubscript = (
  value: string | Decimal,
  displayDecimals = 2,
  locale = 'en-US',
  minZerosForSubscript = 2,
): {
  formatted: string;
  hasSubscript: boolean;
  subscript?: string;
  prefix?: string;
  suffix?: string;
} => {
  let numericValue: Decimal;

  if (value instanceof Decimal) {
    numericValue = value;
  } else {
    numericValue = toDecimal(value);
  }

  // Handle zero or invalid values
  if (numericValue.eq(0) || numericValue.isNaN()) {
    return { formatted: '0', hasSubscript: false };
  }

  const valueStr = numericValue.toString();
  const isNegative = numericValue.lt(0);

  // Check if it's a small value with enough leading zeros for subscript notation
  if (valueStr.includes('.') && valueStr.startsWith('0.')) {
    const afterDecimal = valueStr.split('.')[1];
    let zeroCount = 0;

    // Count leading zeros after decimal point
    for (const char of afterDecimal) {
      if (char === '0') {
        zeroCount++;
      } else {
        break;
      }
    }

    // If enough leading zeros, use subscript notation
    if (zeroCount >= minZerosForSubscript) {
      const significantDigits = afterDecimal.substring(zeroCount);
      // Limit the suffix to the same decimal places as normal formatting
      const truncatedSuffix = significantDigits.substring(0, displayDecimals);
      return {
        formatted: '',
        hasSubscript: true,
        prefix: `${isNegative ? '-' : ''}0.0`,
        subscript: zeroCount.toString(),
        suffix: truncatedSuffix,
      };
    }
  }

  // Standard formatting for regular numbers
  const formatted = new Intl.NumberFormat(locale, {
    style: 'decimal',
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: displayDecimals,
  }).format(numericValue.toNumber());

  return { formatted, hasSubscript: false };
};
