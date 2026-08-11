export default function LoadingSpinner({ fullPage = false }) {
  if (fullPage) {
    return (
      <div className="loading-overlay">
        <div className="spinner" />
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-8)' }}>
      <div className="spinner" />
    </div>
  );
}
