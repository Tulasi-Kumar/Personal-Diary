import { BookOpenText, CalendarDays, Feather, UserRound } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { NotificationBannerHost } from './NotificationBanner';

const tabs = [
  { to: '/', label: 'Today', icon: Feather, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, end: false },
  { to: '/memories', label: 'Memories', icon: BookOpenText, end: false },
  { to: '/profile', label: 'You', icon: UserRound, end: false },
];

export function AppShell() {
  const location = useLocation();
  const hideNav =
    location.pathname.startsWith('/whats-next') ||
    location.pathname.startsWith('/debug') ||
    location.pathname.startsWith('/replay') ||
    location.pathname.endsWith('/replay');

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to the page
      </a>
      <div className={`app-shell${hideNav ? ' app-shell--flush' : ''}`}>
        <main id="main" className="page" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
      {!hideNav && <NotificationBannerHost />}
      {!hideNav && <BottomNav />}
    </>
  );
}

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <div className="bottom-nav__inner">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
          >
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
