import { Outlet } from 'react-router-dom';
import { useWelfare } from '@/context/WelfareContext';
import { BottomNav } from './BottomNav';

export function AppShell() {
  const { remoteError } = useWelfare();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-brand" translate="no">
            Link-Help
          </span>
          <span className="app-tagline">가족 복지·혜택 알림</span>
        </div>
      </header>
      <main className="app-main">
        {remoteError && (
          <p className="remote-warn" role="status">
            {remoteError}
          </p>
        )}
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
