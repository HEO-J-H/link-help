import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { FamilyProvider } from '@/context/FamilyContext';
import { WelfareProvider } from '@/context/WelfareContext';
import { AppShell } from '@/components/layout/AppShell';
import { FamilyPage } from '@/features/family/FamilyPage';
import { MemberDetailPage } from '@/features/family/MemberDetailPage';
import { BenefitListPage } from '@/features/benefit/BenefitListPage';
import { BenefitDetailPage } from '@/features/benefit/BenefitDetailPage';
import { RecommendPage } from '@/features/dashboard/RecommendPage';
import { SettingsPage } from '@/features/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <FamilyProvider>
        <WelfareProvider>
          <Routes>
            <Route element={<AppShell />}>
              <Route path="/" element={<FamilyPage />} />
              <Route path="/family/:id" element={<MemberDetailPage />} />
              <Route path="/benefits" element={<BenefitListPage />} />
              <Route path="/benefits/:id" element={<BenefitDetailPage />} />
              <Route path="/recommend" element={<RecommendPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </WelfareProvider>
      </FamilyProvider>
    </BrowserRouter>
  );
}
