import { useToastStore } from '../store/toastStore';

const ICONS = { success: '✓', error: '✕', info: '💬' };

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          onClick={() => removeToast(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          <span style={{ fontSize: 16 }}>{ICONS[toast.type] || ICONS.info}</span>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
}
