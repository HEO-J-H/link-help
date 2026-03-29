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
import { AboutPage } from '@/features/about/AboutPage';
import { TermsPage } from '@/features/legal/TermsPage';
import { PrivacyPage } from '@/features/legal/PrivacyPage';
import { DisclaimerPage } from '@/features/legal/DisclaimerPage';
import { SmartSearchPage } from '@/features/smartsearch/SmartSearchPage';
import { WelfareTrackingSync } from '@/components/WelfareTrackingSync';

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter basename={routerBasename}>
      <FamilyProvider>
        <ReminderRunner />
        <WelfareProvider>
          <WelfareTrackingSync />
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<FamilyPage />} />
              <Route path="/family/:id" element={<MemberDetailPage />} />
              <Route path="/benefits" element={<BenefitListPage />} />
              <Route path="/benefits/:id" element={<BenefitDetailPage />} />
              <Route path="/recommend" element={<RecommendPage />} />
              <Route path="/smart-find" element={<SmartSearchPage />} />
              <Route path="/timeline" element={<TimelinePage />} />
              <Route
                path="/notifications"
                element={<Navigate to={{ pathname: '/settings', hash: 'reminders' }} replace />}
              />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route
                path="/start"
                element={<Navigate to={{ pathname: '/about', hash: 'quick-start' }} replace />}
              />
              <Route path="/legal/terms" element={<TermsPage />} />
              <Route path="/legal/privacy" element={<PrivacyPage />} />
              <Route path="/legal/disclaimer" element={<DisclaimerPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </WelfareProvider>
      </FamilyProvider>
    </BrowserRouter>
  );
}
