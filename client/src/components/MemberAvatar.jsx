import { getInitials } from '../utils/helpers';

export default function MemberAvatar({ user, size = 'md', className = '' }) {
  const sizeClass = `avatar-${size}`;
  const initials = getInitials(user?.name || '');
  const bg = user?.avatarColor || '#4f46e5';

  return (
    <div
      className={`avatar ${sizeClass} ${className}`}
      style={{ background: bg }}
      title={user?.name}
    >
      {initials}
    </div>
  );
}
