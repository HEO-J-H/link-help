import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'active' : undefined;

type Item = { to: string; icon: string; label: string; end?: boolean };

const items: Item[] = [
  { to: '/', icon: '👪', label: '가족', end: true },
  { to: '/benefits', icon: '🎁', label: '혜택' },
  { to: '/smart-find', icon: '🔎', label: '스마트' },
  { to: '/timeline', icon: '📅', label: '타임라인' },
  { to: '/settings', icon: '⚙️', label: '설정' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="주 메뉴">
      {items.map(({ to, icon, label, end }) => (
        <NavLink key={to} to={to} end={end} className={linkClass} title={label}>
          <span className="bottom-nav__icon" aria-hidden>
            {icon}
          </span>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
