import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FamilyProvider } from '@/context/FamilyContext';
import { WelfareProvider } from '@/context/WelfareContext';
import { ReminderRunner } from '@/components/ReminderRunner';
import { AppShell } from '@/components/layout/AppShell';
import { FamilyPage } from '@/features/family/FamilyPage';
import { MemberDetailPage } from '@/features/family/MemberDetailPage';
import { BenefitListPage } from '@/features/benefit/BenefitListPage';
import { BenefitDetailPage } from '@/features/benefit/BenefitDetailPage';
import { RecommendPage } from '@/features/dashboard/RecommendPage';
import { TimelinePage } from '@/features/timeline/TimelinePage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';

export default function App() {
  return (
    <BrowserRouter>
      <FamilyProvider>
        <ReminderRunner />
        <WelfareProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<FamilyPage />} />
              <Route path="/family/:id" element={<MemberDetailPage />} />
              <Route path="/benefits" element={<BenefitListPage />} />
              <Route path="/benefits/:id" element={<BenefitDetailPage />} />
              <Route path="/recommend" element={<RecommendPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </WelfareProvider>
      </FamilyProvider>
    </BrowserRouter>
  );
}
