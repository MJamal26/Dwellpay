export default function ConfirmDialog({ title, message, confirmLabel = 'Confirm', confirmVariant = 'btn-danger', onConfirm, onCancel, isLoading }) {
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
            Cancel
          </button>
          <button
            className={`btn ${confirmVariant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
