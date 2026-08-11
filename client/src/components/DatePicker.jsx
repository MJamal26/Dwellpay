import { useState, useRef, useEffect } from 'react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getDaysInMonth(year, month) { return new Date(year, month, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month - 1, 1).getDay(); }

/**
 * DatePicker — compact calendar dropdown
 * value: null | { year, month } | { year, month, day }
 * onChange(value)
 */
export default function DatePicker({ value, onChange, placeholder = 'All time' }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('days'); // 'days' | 'months' | 'years'
  const now = new Date();

  const initialDate = value
    ? new Date(value.year, (value.month || 1) - 1, 1)
    : new Date(now.getFullYear(), now.getMonth(), 1);

  const [viewDate, setViewDate] = useState(initialDate);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset view to 'days' when opening
  const handleOpen = () => {
    setView('days');
    setOpen((o) => !o);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1; // 1-based

  const getLabel = () => {
    if (!value) return placeholder;
    if (value.day)
      return `${MONTHS_SHORT[value.month - 1]} ${value.day}, ${value.year}`;
    return `${MONTHS_SHORT[value.month - 1]} ${value.year}`;
  };

  const prevNav = () => {
    if (view === 'days')   setViewDate(new Date(year, month - 2, 1));
    if (view === 'months') setViewDate(new Date(year - 1, viewDate.getMonth(), 1));
    if (view === 'years')  setViewDate(new Date(year - 12, viewDate.getMonth(), 1));
  };

  const nextNav = () => {
    if (view === 'days')   setViewDate(new Date(year, month, 1));
    if (view === 'months') setViewDate(new Date(year + 1, viewDate.getMonth(), 1));
    if (view === 'years')  setViewDate(new Date(year + 12, viewDate.getMonth(), 1));
  };

  const handleHeaderClick = () => {
    if (view === 'days')   setView('months');
    if (view === 'months') setView('years');
  };

  const headerLabel = () => {
    if (view === 'days')   return `${MONTHS_SHORT[month - 1]} ${year}`;
    if (view === 'months') return `${year}`;
    const start = year - 5;
    return `${start} – ${start + 11}`;
  };

  const handleDayClick = (day) => {
    onChange({ year, month, day });
    setOpen(false);
  };

  const handleMonthSelect = (m) => {
    setViewDate(new Date(year, m - 1, 1));
    // Select the month (no day) and close — so expenses for whole month are shown
    onChange({ year, month: m });
    setOpen(false);
  };

  const handleYearSelect = (y) => {
    setViewDate(new Date(y, viewDate.getMonth(), 1));
    setView('months');
  };

  const today = now;

  return (
    <div className="date-picker-wrapper" ref={ref}>
      <button className="date-picker-trigger" onClick={handleOpen} type="button">
        <span style={{ marginRight: 6 }}>📅</span>
        {getLabel()}
        <span style={{ marginLeft: 8, fontSize: 10, opacity: 0.6 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="date-picker-popup">
          {/* Header nav */}
          <div className="dp-header">
            <button className="dp-nav-btn" onClick={prevNav} type="button">‹</button>
            <button className="dp-header-label" onClick={handleHeaderClick} type="button">
              {headerLabel()}
            </button>
            <button className="dp-nav-btn" onClick={nextNav} type="button">›</button>
          </div>

          {/* Days view */}
          {view === 'days' && (
            <>
              <div className="dp-weekdays">
                {DAYS.map((d) => <span key={d}>{d}</span>)}
              </div>
              <div className="dp-days-grid">
                {Array.from({ length: getFirstDayOfMonth(year, month) }).map((_, i) => (
                  <div key={`e${i}`} />
                ))}
                {Array.from({ length: getDaysInMonth(year, month) }).map((_, i) => {
                  const day = i + 1;
                  const isToday =
                    today.getFullYear() === year &&
                    today.getMonth() + 1 === month &&
                    today.getDate() === day;
                  const isSelected =
                    value?.year === year && value?.month === month && value?.day === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`dp-day${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}`}
                      onClick={() => handleDayClick(day)}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Months view */}
          {view === 'months' && (
            <div className="dp-months-grid">
              {MONTHS_SHORT.map((m, i) => {
                const isSelected = value?.year === year && value?.month === i + 1;
                return (
                  <button
                    key={m}
                    type="button"
                    className={`dp-month${isSelected ? ' selected' : ''}`}
                    onClick={() => handleMonthSelect(i + 1)}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          )}

          {/* Years view */}
          {view === 'years' && (
            <div className="dp-years-grid">
              {Array.from({ length: 12 }, (_, i) => year - 5 + i).map((y) => {
                const isSelected = value?.year === y;
                return (
                  <button
                    key={y}
                    type="button"
                    className={`dp-year${isSelected ? ' selected' : ''}`}
                    onClick={() => handleYearSelect(y)}
                  >
                    {y}
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="dp-footer">
            <button
              type="button"
              className="dp-footer-btn"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              All time
            </button>
            <button
              type="button"
              className="dp-footer-btn primary"
              onClick={() => {
                const t = new Date();
                onChange({ year: t.getFullYear(), month: t.getMonth() + 1, day: t.getDate() });
                setOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
