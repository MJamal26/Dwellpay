import { CATEGORY_MAP } from '../utils/helpers';

export default function CategoryBadge({ category, size = 40 }) {
  const cat = CATEGORY_MAP[category] || CATEGORY_MAP.other;
  return (
    <div className="category-badge" style={{ width: size, height: size, fontSize: size * 0.45 }}>
      {cat.emoji}
    </div>
  );
}
