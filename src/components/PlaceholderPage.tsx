import type { ReactNode } from 'react';

export function PlaceholderPage({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page--narrow stack stack-5">
      <header className="page-header">
        <div>
          <p className="label label--bronze">DayBook</p>
          <h1 className="display">{title}</h1>
        </div>
      </header>
      <hr className="rule" />
      <div className="empty">
        <div className="empty__mark" />
        <p className="body muted">{children ?? 'This page is being bound.'}</p>
      </div>
    </div>
  );
}
