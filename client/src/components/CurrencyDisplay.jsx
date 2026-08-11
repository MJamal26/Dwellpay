import { formatCurrency } from '../utils/helpers';

export default function CurrencyDisplay({ amount, currency = 'INR', size = 'md', className = '' }) {
  const type = amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral';

  const sizeStyles = {
    sm: { fontSize: '1rem' },
    md: { fontSize: '1.25rem' },
    lg: { fontSize: '1.75rem' },
    xl: { fontSize: '2.5rem' },
    display: { fontSize: '3rem' },
  };

  return (
    <span
      className={`currency-display ${type} ${className}`}
      style={sizeStyles[size] || sizeStyles.md}
    >
      {formatCurrency(amount, currency)}
    </span>
  );
}
