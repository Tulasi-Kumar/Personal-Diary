import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/db/db';
import { isDemoLoaded } from '../../lib/seed/demo';
import { computeReadiness } from '../../lib/memory/readiness';
import { computeSalience } from '../../lib/memory/salience';
import { NotFoundPage } from '../not-found/NotFoundPage';

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return numerator / denominator;
}

function formatRate(value: number | null): string {
  return value === null ? '—' : `${Math.round(value * 100)}%`;
}

function formatMs(value: number | null): string {
  if (value === null) return '—';
  return value < 1000 ? `${Math.round(value)} ms` : `${(value / 1000).toFixed(1)} s`;
}

export function DebugPage() {
  const allowed =
    import.meta.env.DEV ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('daybook:debug') === '1');

  const data = useLiveQuery(async () => {
    if (!allowed) return null;
    const [pieces, days, ribbons, recaps, signals, jobs, metrics, demoLoaded] =
      await Promise.all([
        db.pieces.toArray(),
        db.days.toArray(),
        db.ribbons.toArray(),
        db.recaps.toArray(),
        db.daySignals.toArray(),
        db.aiJobs.toArray(),
        db.metrics.toArray(),
        isDemoLoaded(),
      ]);
    return { pieces, days, ribbons, recaps, signals, jobs, metrics, demoLoaded };
  }, [allowed]);

  if (!allowed) return <NotFoundPage />;
  if (!data) {
    return (
      <div className="page--narrow stack stack-4">
        <p className="label label--bronze">Debug</p>
        <div className="skeleton" style={{ height: '10rem', width: '100%' }} />
      </div>
    );
  }

  const activeDays = new Set(data.pieces.map((piece) => piece.date)).size;
  const openToSave = median(
    data.metrics
      .filter((metric) => metric.name === 'open_to_save_ms')
      .map((metric) => metric.value),
  );
  const polishSuccess = data.metrics.filter((metric) => metric.name === 'polish_success').length;
  const polishErrors = data.metrics.filter((metric) => metric.name === 'polish_error').length;
  const undos = data.metrics.filter((metric) => metric.name === 'polish_undo').length;
  const successes = data.metrics.filter((metric) => metric.name.endsWith('_success')).length;
  const errors = data.metrics.filter((metric) => metric.name.endsWith('_error')).length;
  const doneJobs = data.jobs.filter((job) => job.status === 'done');
  const skippedJobs = doneJobs.filter(
    (job) =>
      typeof job.result === 'object' &&
      job.result !== null &&
      (job.result as { skipped?: boolean }).skipped === true,
  ).length;
  const latency = median(
    doneJobs
      .filter((job) => typeof job.completedAt === 'number')
      .map((job) => Math.max(0, (job.completedAt as number) - job.createdAt)),
  );
  const readiness = computeReadiness({
    pieces: data.pieces,
    days: data.days,
    ribbons: data.ribbons,
    recaps: data.recaps,
    signals: data.signals,
    demoLoaded: data.demoLoaded,
  });
  const salience = [...data.signals]
    .sort((a, b) => computeSalience(b) - computeSalience(a))
    .slice(0, 5);

  const rows = [
    { label: 'Median open to save', value: formatMs(openToSave) },
    {
      label: 'Pieces per active day',
      value: activeDays === 0 ? '—' : (data.pieces.length / activeDays).toFixed(2),
    },
    { label: 'Undo rate', value: formatRate(rate(undos, polishSuccess + polishErrors)) },
    { label: 'AI failure rate', value: formatRate(rate(errors, successes + errors)) },
    { label: 'Cache hit rate', value: formatRate(rate(skippedJobs, doneJobs.length)) },
    { label: 'Job latency', value: formatMs(latency) },
    {
      label: 'Readiness',
      value: `${readiness.level} · ${(readiness.score * 100).toFixed(0)}`,
    },
  ];

  return (
    <div className="page--narrow stack stack-6">
      <header className="stack stack-3">
        <p className="label label--bronze">Debug</p>
        <h1 className="display">Local signals</h1>
        <p className="body-sm muted">
          Nothing here leaves this device. Clear all data removes it.
        </p>
      </header>

      <section className="hairline-list">
        {rows.map((row) => (
          <div key={row.label} className="settings-row">
            <p className="body">{row.label}</p>
            <span className="label label--bronze">{row.value}</span>
          </div>
        ))}
      </section>

      <section className="section" aria-labelledby="salience-title">
        <h2 id="salience-title" className="section-title">
          Salience
        </h2>
        <div className="hairline-list">
          {salience.length === 0 ? (
            <p className="body-sm muted">No signals yet.</p>
          ) : (
            salience.map((signal) => (
              <div key={signal.date} className="settings-row">
                <span className="body-sm">{signal.date}</span>
                <span className="label label--bronze">
                  {computeSalience(signal).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="section" aria-labelledby="jobs-title">
        <h2 id="jobs-title" className="section-title">
          Jobs
        </h2>
        <div className="hairline-list">
          {data.jobs.length === 0 ? (
            <p className="body-sm muted">No jobs have run.</p>
          ) : (
            [...data.jobs]
              .sort((a, b) => b.createdAt - a.createdAt)
              .slice(0, 12)
              .map((job) => (
                <div key={job.id} className="settings-row">
                  <span className="body-sm">
                    {job.task} · {job.status}
                  </span>
                  <span className="meta">{new Date(job.createdAt).toLocaleTimeString()}</span>
                </div>
              ))
          )}
        </div>
      </section>
    </div>
  );
}
