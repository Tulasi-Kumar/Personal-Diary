import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="page--narrow empty">
      <div className="empty__mark" />
      <p className="label label--bronze">DayBook</p>
      <h1 className="headline" style={{ marginTop: '0.5rem' }}>
        This page is not in the book.
      </h1>
      <p className="body muted" style={{ marginTop: '0.75rem' }}>
        The address may be old, or the page may have moved.
      </p>
      <div style={{ marginTop: '1.5rem' }}>
        <Link to="/" className="btn btn--secondary">
          Return to today
        </Link>
      </div>
    </div>
  );
}
