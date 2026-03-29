import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'active' : undefined;

type Item = { to: string; icon: string; label: string; end?: boolean; title?: string };

const items: Item[] = [
  { to: '/', icon: '👪', label: '가족', end: true },
  { to: '/benefits', icon: '🎁', label: '혜택' },
  { to: '/smart-find', icon: '🔎', label: '복지찾기', title: '숨은 복지·혜택찾기' },
  { to: '/timeline', icon: '📅', label: '타임라인' },
  { to: '/settings', icon: '⚙️', label: '설정' },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="주 메뉴">
      {items.map(({ to, icon, label, end, title: navTitle }) => (
        <NavLink key={to} to={to} end={end} className={linkClass} title={navTitle ?? label}>
          <span className="bottom-nav__icon" aria-hidden>
            {icon}
          </span>
          <span className="bottom-nav__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
