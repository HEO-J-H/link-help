import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-brand-block">
            <span className="app-brand" translate="no">
              Link-Help
            </span>
            <span className="app-tagline">놓치기 쉬운 복지·혜택 찾기</span>
          </div>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
