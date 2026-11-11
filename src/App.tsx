import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ScrollToTop } from './components/ScrollToTop';
import { ToastProvider } from './components/Toast';
import { startAiQueue } from './lib/ai/queue';
import { HomePage } from './features/home/HomePage';
import { NotFoundPage } from './features/not-found/NotFoundPage';

const CalendarPage = lazy(() =>
  import('./features/calendar/CalendarPage').then((module) => ({ default: module.CalendarPage })),
);
const MemoriesPage = lazy(() =>
  import('./features/memories/MemoriesPage').then((module) => ({ default: module.MemoriesPage })),
);
const MonthlyRecapPage = lazy(() =>
  import('./features/memories/MonthlyRecapPage').then((module) => ({
    default: module.MonthlyRecapPage,
  })),
);
const DayPage = lazy(() =>
  import('./features/day/DayPage').then((module) => ({ default: module.DayPage })),
);
const ProfilePage = lazy(() =>
  import('./features/profile/ProfilePage').then((module) => ({ default: module.ProfilePage })),
);
const WhatsNextPage = lazy(() =>
  import('./features/whats-next/WhatsNextPage').then((module) => ({
    default: module.WhatsNextPage,
  })),
);

const ReplayPage = lazy(() =>
  import('./features/replay/ReplayPage').then((module) => ({ default: module.ReplayPage })),
);
const DebugPage = lazy(() =>
  import('./features/debug/DebugPage').then((module) => ({ default: module.DebugPage })),
);

function RouteFallback() {
  return (
    <div className="page--narrow stack stack-4">
      <div className="skeleton" style={{ height: '12rem', width: '100%' }} />
    </div>
  );
}

export default function App() {
  useEffect(() => {
    startAiQueue();
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="day/:date" element={<DayPage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="memories" element={<MemoriesPage />} />
              <Route path="memories/month/:month" element={<MonthlyRecapPage />} />
              <Route path="replay" element={<ReplayPage />} />
              <Route path="day/:date/replay" element={<ReplayPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="whats-next" element={<WhatsNextPage />} />
              <Route path="debug" element={<DebugPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ToastProvider>
  );
}
