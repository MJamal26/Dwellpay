export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p className="text-muted">{description}</p>}
      {action}
    </div>
  );
}
