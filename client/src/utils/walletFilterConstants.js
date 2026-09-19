/**
 * Wallet Filter Constants
 * Single source of truth for wallet filtering logic derived from statsData structure
 * 
 * These constants match the backend WalletTransaction model enums:
 * - walletType: ["e_cash", "upgrade", "help", "ddf", "e_pool", "e_pool_upgrade"]
 * - type: ["credit", "debit"]
 */

// Valid wallet types - matches backend enum and statsData structure
export const VALID_WALLET_TYPES = [
  "e_cash",
  "upgrade",
  "help",
  "ddf",
  "e_pool",
  "e_pool_upgrade",
];

// Valid transaction types - matches backend enum
export const VALID_TRANSACTION_TYPES = ["credit", "debit"];

// Wallet type display labels - derived from statsData labels
export const WALLET_TYPE_LABELS = {
  e_cash: "E-Cash",
  upgrade: "Upgrade",
  help: "Help",
  ddf: "DDF",
  e_pool: "E-Pool",
  e_pool_upgrade: "E-Pool Upgrade",
};

// Transaction type display labels
export const TRANSACTION_TYPE_LABELS = {
  credit: "Credit",
  debit: "Debit",
};

/**
 * Normalize and validate wallet type
 * @param {string} walletType - The wallet type to normalize
 * @returns {string|null} - Normalized wallet type or null if invalid
 */
export const normalizeWalletType = (walletType) => {
  if (!walletType || typeof walletType !== "string") return null;
  const normalized = walletType.toLowerCase().trim();
  return VALID_WALLET_TYPES.includes(normalized) ? normalized : null;
};

/**
 * Normalize and validate transaction type
 * @param {string} type - The transaction type to normalize
 * @returns {string|null} - Normalized transaction type or null if invalid
 */
export const normalizeTransactionType = (type) => {
  if (!type || typeof type !== "string") return null;
  const normalized = type.toLowerCase().trim();
  return VALID_TRANSACTION_TYPES.includes(normalized) ? normalized : null;
};

/**
 * Get wallet type options for dropdown/select components
 * @returns {Array<{label: string, value: string}>} - Array of wallet type options
 */
export const getWalletTypeOptions = () => {
  return VALID_WALLET_TYPES.map((type) => ({
    label: WALLET_TYPE_LABELS[type] || type,
    value: type,
  }));
};

/**
 * Get transaction type options for dropdown/select components
 * @returns {Array<{label: string, value: string}>} - Array of transaction type options
 */
export const getTransactionTypeOptions = () => {
  return VALID_TRANSACTION_TYPES.map((type) => ({
    label: TRANSACTION_TYPE_LABELS[type] || type,
    value: type,
  }));
};
