import { Decimal } from 'decimal.js';

// Configure Decimal.js to avoid scientific notation for financial calculations
Decimal.set({
  toExpNeg: -100, // Avoid scientific notation for numbers >= 1e-100
  toExpPos: 100, // Avoid scientific notation for numbers <= 1e100
  precision: 100, // Increase precision for very precise calculations
});
/**
 * Decimal.js utility functions for precise financial calculations
 *
 * These functions ensure no floating-point precision loss occurs during
 * financial calculations such as claimable rewards, max amounts, APY, etc.
 */

/**
 * Convert a value to Decimal safely
 * @param value - string, number, or Decimal to convert
 * @returns Decimal instance
 */
export const toDecimal = (value: string | number | Decimal | bigint): Decimal => {
  if (value instanceof Decimal) {
    return value;
  }
  if (typeof value === 'bigint') {
    return new Decimal(value.toString());
  }

  // Handle null/undefined/empty string
  if (value === null || value === undefined || value === '') {
    return new Decimal(0);
  }

  try {
    return new Decimal(value);
  } catch (error) {
    console.warn(`Failed to convert "${value}" to Decimal, using 0:`, error);
    return new Decimal(0);
  }
};

/**
 * Safe decimal addition
 * @param a - first operand
 * @param b - second operand
 * @returns Decimal result
 */
export const decimalAdd = (a: string | number | Decimal, b: string | number | Decimal): Decimal => {
  return toDecimal(a).plus(toDecimal(b));
};

/**
 * Safe decimal subtraction
 * @param a - minuend
 * @param b - subtrahend
 * @returns Decimal result
 */
export const decimalSubtract = (
  a: string | number | Decimal,
  b: string | number | Decimal
): Decimal => {
  return toDecimal(a).minus(toDecimal(b));
};

/**
 * Safe decimal multiplication
 * @param a - first factor
 * @param b - second factor
 * @returns Decimal result
 */
export const decimalMultiply = (
  a: string | number | Decimal,
  b: string | number | Decimal
): Decimal => {
  return toDecimal(a).times(toDecimal(b));
};

/**
 * Safe decimal division
 * @param a - dividend
 * @param b - divisor
 * @returns Decimal result
 */
export const decimalDivide = (
  a: string | number | Decimal,
  b: string | number | Decimal
): Decimal => {
  const divisor = toDecimal(b);

  if (divisor.equals(0)) {
    console.warn('Division by zero attempted, returning 0');
    return new Decimal(0);
  }

  return toDecimal(a).dividedBy(divisor);
};

/**
 * Get maximum of two decimal values
 * @param a - first value
 * @param b - second value
 * @returns Decimal max value
 */
export const decimalMax = (a: string | number | Decimal, b: string | number | Decimal): Decimal => {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.greaterThan(decB) ? decA : decB;
};

/**
 * Get minimum of two decimal values
 * @param a - first value
 * @param b - second value
 * @returns Decimal min value
 */
export const decimalMin = (a: string | number | Decimal, b: string | number | Decimal): Decimal => {
  const decA = toDecimal(a);
  const decB = toDecimal(b);
  return decA.lessThan(decB) ? decA : decB;
};

/**
 * Safe decimal exponentiation (power)
 * @param base - base number
 * @param exponent - exponent
 * @returns Decimal result
 */
export const decimalPow = (
  base: string | number | Decimal,
  exponent: string | number | Decimal
): Decimal => {
  return toDecimal(base).pow(toDecimal(exponent));
};

/**
 * Compare two decimal values
 * @param a - first value
 * @param b - second value
 * @returns -1 if a < b, 0 if a = b, 1 if a > b
 */
export const decimalCompare = (
  a: string | number | Decimal,
  b: string | number | Decimal
): number => {
  const decA = toDecimal(a);
  const decB = toDecimal(b);

  if (decA.lessThan(decB)) return -1;
  if (decA.greaterThan(decB)) return 1;
  return 0;
};

/**
 * Check if decimal value is greater than another
 * @param a - first value
 * @param b - second value
 * @returns true if a > b
 */
export const decimalGreaterThan = (
  a: string | number | Decimal,
  b: string | number | Decimal
): boolean => {
  return toDecimal(a).greaterThan(toDecimal(b));
};

/**
 * Check if decimal value is less than or equal to another
 * @param a - first value
 * @param b - second value
 * @returns true if a <= b
 */
export const decimalLessThanOrEqual = (
  a: string | number | Decimal,
  b: string | number | Decimal
): boolean => {
  return toDecimal(a).lessThanOrEqualTo(toDecimal(b));
};

/**
 * Check if decimal value equals another
 * @param a - first value
 * @param b - second value
 * @returns true if a equals b
 */
export const decimalEquals = (
  a: string | number | Decimal,
  b: string | number | Decimal
): boolean => {
  return toDecimal(a).equals(toDecimal(b));
};

/**
 * Format decimal to fixed decimal places with proper precision
 * @param value - value to format
 * @param decimals - number of decimal places
 * @returns formatted string
 */
export const toFixedDecimal = (value: string | number | Decimal, decimals: number = 18): string => {
  return toDecimal(value).toFixed(decimals);
};

/**
 * Convert decimal to string, removing trailing zeros
 * @param value - value to convert
 * @returns clean string representation
 */
export const decimalToString = (value: string | number | Decimal): string => {
  return toDecimal(value).toString();
};

/**
 * Get exact decimal string for max button and precise input usage
 * This preserves full precision without any rounding or scientific notation
 * @param value - value to convert
 * @returns exact string representation for precise user input
 */
export const decimalToExactString = (value: string | number | Decimal): string => {
  return toDecimal(value).toString();
};

/**
 * Convert decimal to number (for display only, never for calculations)
 * @param value - value to convert
 * @returns number representation
 */
export const decimalToNumber = (value: string | number | Decimal): number => {
  return toDecimal(value).toNumber();
};

/**
 * Safe decimal conversion with fallback
 * @param value - value to convert
 * @param fallback - fallback value if conversion fails
 * @returns Decimal instance
 */
export const safeDecimalConversion = (
  value: any,
  fallback: string | number | Decimal = 0
): Decimal => {
  if (value instanceof Decimal) {
    return value;
  }

  if (typeof value === 'number' && !isNaN(value)) {
    return new Decimal(value);
  }

  if (typeof value === 'string' && value.trim() !== '') {
    try {
      const parsed = new Decimal(value);
      return parsed;
    } catch (error) {
      console.warn(`Failed to parse "${value}" as Decimal, using fallback:`, fallback);
      return toDecimal(fallback);
    }
  }

  return toDecimal(fallback);
};

/**
 * Calculate compound interest with precise decimal arithmetic
 * @param principal - initial amount
 * @param rate - interest rate (as decimal, e.g. 0.05 for 5%)
 * @param periods - number of compounding periods
 * @param periodsPerYear - compounding frequency (default: 1)
 * @returns Decimal final amount
 */
export const decimalCompoundInterest = (
  principal: string | number | Decimal,
  rate: string | number | Decimal,
  periods: string | number | Decimal,
  periodsPerYear: string | number | Decimal = 1
): Decimal => {
  const p = toDecimal(principal);
  const r = toDecimal(rate);
  const n = toDecimal(periodsPerYear);
  const t = toDecimal(periods);

  // A = P(1 + r/n)^(nt)
  const onePlusRate = decimalAdd(1, decimalDivide(r, n));
  const exponent = decimalMultiply(n, t);
  const compound = decimalPow(onePlusRate, exponent);

  return decimalMultiply(p, compound);
};

/**
 * Calculate APY with precise decimal arithmetic
 * @param dailyRate - daily interest rate as decimal
 * @param periodsPerDay - rebases per day (default: 2)
 * @returns Decimal APY as percentage (e.g., 25.5 for 25.5%)
 */
export const decimalCalculateAPY = (
  dailyRate: string | number | Decimal,
  periodsPerDay: string | number | Decimal = 2
): Decimal => {
  // APY = (1 + dailyRate / periodsPerDay)^(periodsPerDay * 365) - 1
  // const ratePerPeriod = decimalDivide(dailyRate, periodsPerDay);
  const ratePerPeriod = new Decimal(dailyRate);
  const onePlusRate = decimalAdd(1, ratePerPeriod);
  const periodsPerYear = decimalMultiply(periodsPerDay, 365);
  const compound = decimalPow(onePlusRate, periodsPerYear);
  const apy = decimalSubtract(compound, 1);

  // Convert to percentage
  return decimalMultiply(apy, 100);
};

/**
 * Zero decimal value
 */
export const zeroDecimal = new Decimal(0);
