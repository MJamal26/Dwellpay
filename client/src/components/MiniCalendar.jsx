import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/helpers';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export default function MiniCalendar({ expenses = [], currency = 'INR', compact = false }) {
  const navigate = useNavigate();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based
  const todayDate = today.getDate();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build day → amount map for this month
  const dayMap = {};
  for (const exp of expenses) {
    const d = new Date(exp.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      dayMap[day] = (dayMap[day] || 0) + exp.amount;
    }
  }

  const handleDayClick = (day) => {
    const pad = (n) => String(n).padStart(2, '0');
    navigate(`/expenses?date=${year}-${pad(month + 1)}-${pad(day)}`);
  };

  // Compact mode uses smaller font sizes so it fits natively in a half-width card
  const dayNumSize  = compact ? 8  : 10;
  const dotSize     = compact ? 3  : 4;
  const headerSize  = compact ? 11 : 14;
  const weekdaySize = compact ? 7  : 10;
  const cellGap     = compact ? 1  : 2;

  return (
    <div className="mini-calendar">
      <div className="mini-cal-month-label" style={{ fontSize: headerSize }}>
        {MONTHS[month]} {year}
      </div>

      <div className="mini-cal-weekdays" style={{ marginBottom: 1 }}>
        {DAYS.map((d) => (
          <span key={d} style={{ fontSize: weekdaySize }}>{d}</span>
        ))}
      </div>

      <div className="mini-cal-grid" style={{ gap: cellGap }}>
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`e${i}`} className="mini-cal-cell empty" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isToday = day === todayDate;
          const amount = dayMap[day] || 0;
          const hasExp = amount > 0;

          return (
            <button
              key={day}
              type="button"
              className={`mini-cal-cell${isToday ? ' today' : ''}${hasExp ? ' has-exp' : ''}`}
              onClick={() => hasExp && handleDayClick(day)}
              title={hasExp ? formatCurrency(amount, currency) : undefined}
              style={{ gap: cellGap }}
            >
              <span className="mini-cal-day-num" style={{ fontSize: dayNumSize }}>{day}</span>
              {hasExp && (
                <span
                  className="mini-cal-dot"
                  style={{ width: dotSize, height: dotSize, flexShrink: 0 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
