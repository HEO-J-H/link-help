import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'active' : undefined;

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="주 메뉴">
      <NavLink to="/" end className={linkClass}>
        가족
      </NavLink>
      <NavLink to="/benefits" className={linkClass}>
        혜택
      </NavLink>
      <NavLink to="/recommend" className={linkClass}>
        추천
      </NavLink>
      <NavLink to="/timeline" className={linkClass}>
        타임라인
      </NavLink>
      <NavLink to="/settings" className={linkClass}>
        설정
      </NavLink>
    </nav>
  );
}
