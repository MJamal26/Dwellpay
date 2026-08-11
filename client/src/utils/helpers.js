/**
 * Format a number as currency with ₹ or $ symbol
 * @param {number} amount
 * @param {'INR'|'USD'} currency
 * @param {boolean} compact - use 1.2K format for large numbers
 */
export function formatCurrency(amount, currency = 'INR', compact = false) {
  const symbol = currency === 'USD' ? '$' : '₹';
  const num = Math.abs(amount);

  if (compact && num >= 1000) {
    const formatted = (num / 1000).toFixed(1).replace(/\.0$/, '');
    return `${symbol}${formatted}K`;
  }

  const formatted = new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  return `${symbol}${formatted}`;
}

/**
 * Get initials from a full name (up to 2 characters)
 */
export function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Format date relative to today (Today, Yesterday, or date string)
 */
export function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Format date as "Aug 10"
 */
export function formatDateShort(date) {
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Category emoji map
 */
export const CATEGORY_MAP = {
  food:          { emoji: '🍽️', label: 'Food' },
  groceries:     { emoji: '🛒', label: 'Groceries' },
  rent:          { emoji: '🏠', label: 'Rent' },
  utilities:     { emoji: '💡', label: 'Utilities' },
  internet:      { emoji: '📶', label: 'Internet' },
  transport:     { emoji: '🚌', label: 'Transport' },
  entertainment: { emoji: '🎬', label: 'Entertainment' },
  health:        { emoji: '💊', label: 'Health' },
  shopping:      { emoji: '🛍️', label: 'Shopping' },
  travel:        { emoji: '✈️', label: 'Travel' },
  subscriptions: { emoji: '📱', label: 'Subscriptions' },
  other:         { emoji: '📦', label: 'Other' },
};

export const CATEGORIES = Object.entries(CATEGORY_MAP).map(([key, val]) => ({
  key,
  ...val,
}));

/**
 * Month names
 */
export const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
