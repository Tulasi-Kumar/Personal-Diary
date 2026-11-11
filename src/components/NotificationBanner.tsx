import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import {
  consumeNotification,
  nextNotification,
  type NotificationEvent,
} from '../lib/notifications';

export function NotificationBannerHost() {
  const settings = useSettings();
  const location = useLocation();
  const [event, setEvent] = useState<NotificationEvent | null>(null);
  const evaluated = useRef(false);

  useEffect(() => {
    if (!settings || evaluated.current) return;
    evaluated.current = true;
    let cancelled = false;
    void nextNotification(settings).then((next) => {
      if (!cancelled) setEvent(next);
    });
    return () => {
      cancelled = true;
    };
  }, [settings]);

  useEffect(() => {
    setEvent(null);
  }, [location.pathname]);

  useEffect(() => {
    function onFocus() {
      if (!settings) return;
      void nextNotification(settings).then((next) => {
        if (next) setEvent((current) => current ?? next);
      });
    }
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [settings]);

  if (!event) return null;

  function dismiss() {
    if (event) void consumeNotification(event);
    setEvent(null);
  }

  function act() {
    if (event) void consumeNotification(event);
    setEvent(null);
  }

  return (
    <div className="notification-banner" role="status">
      <div className="notification-banner__inner">
        <div className="notification-banner__text">
          <span className="label label--bronze">{event.message}</span>
          <span className="body-sm notification-banner__detail">{event.detail}</span>
        </div>
        <div className="row" style={{ gap: '0.25rem' }}>
          <Link to={event.to} className="btn btn--ghost notification-banner__action" onClick={act}>
            {event.actionLabel}
          </Link>
          <button
            type="button"
            className="btn-icon notification-banner__close"
            onClick={dismiss}
            aria-label="Dismiss notification"
          >
            <X aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
