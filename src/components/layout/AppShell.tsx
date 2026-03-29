import { Outlet } from 'react-router-dom';
import { useWelfare } from '@/context/WelfareContext';
import { BottomNav } from './BottomNav';

export function AppShell() {
  const { remoteError } = useWelfare();

  return (
    <div className="app-shell">
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
