/**
 * Pure validation utilities for form inputs and data validation
 * These functions throw standard Error objects for use with unified status system
 */

/**
 * Validates that a required field has a value
 */
export function validateRequired(value: string | null | undefined, fieldName: string): string {
  if (!value || value.trim() === '') {
    throw new Error(`${fieldName} is required`);
  }
  return value.trim();
}

/**
 * Validates Ethereum address format
 */
export function validateAddress(
  address: string | null | undefined,
  fieldName: string = 'Address'
): string {
  const trimmedAddress = validateRequired(address, fieldName);

  if (!trimmedAddress.startsWith('0x') || trimmedAddress.length !== 42) {
    throw new Error(`${fieldName} format is invalid`);
  }

  return trimmedAddress;
}

/**
 * Validates positive number input
 */
export function validatePositiveNumber(
  value: string | number | null | undefined,
  fieldName: string = 'Amount'
): number {
  if (value === null || value === undefined || value === '') {
    throw new Error(`${fieldName} is required`);
  }

  const numValue = typeof value === 'string' ? parseFloat(value) : value;

  if (isNaN(numValue)) {
    throw new Error(`${fieldName} must be a valid number`);
  }

  if (numValue <= 0) {
    throw new Error(`${fieldName} must be greater than zero`);
  }

  return numValue;
}

/**
 * Validates mode ID against available modes
 */
export function validateModeId<T extends { id: string }>(
  modeId: string | number | null | undefined,
  availableModes: T[],
  fieldName: string = 'Mode ID'
): string {
  if (modeId === null || modeId === undefined || modeId === '') {
    throw new Error(`${fieldName} is required`);
  }

  // Convert to string for comparison since mode IDs are strings
  const modeIdStr = String(modeId);

  // Check if the mode ID exists in available modes
  const modeExists = availableModes.some((mode) => mode.id === modeIdStr);

  if (!modeExists) {
    const availableIds = availableModes.map((mode) => mode.id).join(', ');
    throw new Error(`Invalid ${fieldName.toLowerCase()}. Available options: ${availableIds}`);
  }

  return modeIdStr;
}

/**
 * Validates that required data exists
 */
export function validateRequiredData<T>(data: T | null | undefined, fieldName: string): T {
  if (!data) {
    throw new Error(`${fieldName} is required`);
  }
  return data;
}
