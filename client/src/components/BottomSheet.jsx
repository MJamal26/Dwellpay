import { useEffect } from 'react';

export default function BottomSheet({ children, onClose, title }) {
  // Close on ESC key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div className="bottom-sheet-overlay" onClick={onClose}>
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="bottom-sheet-handle" />
        {title && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-headline-md">{title}</h2>
            <button
              onClick={onClose}
              style={{
                background: 'var(--color-surface-container)',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ×
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
