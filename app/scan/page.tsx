'use client';
import { ScoreRing } from '@/components/dashboard/score-ring';
import { useApp } from '@/components/layout/app-provider';
import { ScanButton } from '@/components/layout/app-shell';
import { BrowserPreview } from '@/components/scans/browser-preview';
import { ScanPhaseStepper } from '@/components/scans/scan-phase-stepper';
import { PageHeading } from '@/components/ui/page-heading';
import { Button, Card, CardHeader, SeverityBadge, StatusBadge } from '@/components/ui/primitives';
import { latestScan, scanFixes, scanIssues } from '@/lib/mock-data/scans';
import { cn } from '@/lib/utils';
import { ArrowRight, CheckCircle2, ChevronRight, Clock3, FileCode2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
export default function ScanPage() {
  const [selected, setSelected] = useState(1);
  const [phase, setPhase] = useState<string | null>(null);
  const { lastScanned, environment, scanNumber } = useApp();
  return (
    <>
      <PageHeading
        title="Readiness Scan Results"
        subtitle="Detailed analysis of how autonomous shoppers interact with your storefront."
        action={
          <>
            <div className="last-scanned">
              <span>Last scanned</span>
              <strong>{lastScanned}</strong>
            </div>
            <ScanButton outline />
          </>
        }
      />
      <div className="scan-run-meta">
        <StatusBadge>Completed</StatusBadge>
        <span className="mono">SCN-{String(scanNumber).padStart(4, '0')}</span>
        <span>
          <GlobeSmall />
          {environment}
        </span>
        <span>
          <FileCode2 size={13} />
          86 pages
        </span>
        <span>
          <Clock3 size={13} />
          2m 34s
        </span>
        <span>5 agent profiles tested</span>
      </div>
      <ScanPhaseStepper selected={phase} onSelect={setPhase} />
      {phase && (
        <div className="phase-detail">
          <CheckCircle2 size={16} />
          <span>
            <strong>{phase}:</strong>{' '}
            {phase === 'Checkout Flow'
              ? 'All 8 checkout checks passed. Cart state, payment sandbox, and order simulation are consistent.'
              : `${latestScan.phases.find((p) => p.name === phase)?.issues} checks need attention. Review the annotations and suggested fixes below.`}
          </span>
          <button onClick={() => setPhase(null)}>Dismiss</button>
        </div>
      )}
      <div className="scan-layout">
        <BrowserPreview selected={selected} onSelect={setSelected} />
        <div className="scan-right-column">
          <Card className="scan-score-card">
            <CardHeader
              title="Overall readiness score"
              action={<span className="subtle-badge">Scan #{scanNumber}</span>}
            />
            <div className="scan-score-body">
              <ScoreRing score={74} compact />
              <div>
                <h3>
                  Good foundation —<br />
                  room to improve
                </h3>
                <p>Resolve priority issues to make shopping sessions more reliable.</p>
                <span className="positive">↗ +4 since previous scan</span>
              </div>
            </div>
          </Card>
          <Card className="issues-card">
            <CardHeader
              title="Issues detected"
              action={
                <StatusBadge tone="red" dot={false}>
                  3 critical
                </StatusBadge>
              }
            />
            <div className="issues-table-header">
              <span>ISSUE</span>
              <span>SEVERITY</span>
            </div>
            {scanIssues.map((issue) => (
              <button
                key={issue.id}
                className={cn('scan-issue-row', selected === issue.id && 'selected')}
                onClick={() => setSelected(issue.id)}
                aria-pressed={selected === issue.id}
              >
                <span className="issue-number">{issue.id}</span>
                <span>
                  <strong>{issue.title}</strong>
                  <small>{issue.category}</small>
                </span>
                <SeverityBadge severity={issue.severity} />
                <ChevronRight size={13} />
              </button>
            ))}
          </Card>
          <Card className="scan-fixes">
            <CardHeader
              title="Suggested fixes"
              action={<span className="subtle-badge">4 fixes</span>}
            />
            {scanFixes.map((fix, i) => (
              <Link href="/recommendations" className="suggested-fix" key={fix.title}>
                <span>{i + 1}</span>
                <div>
                  <strong>{fix.title}</strong>
                  <small className={fix.impact === 'High' ? 'impact-text' : ''}>
                    {fix.impact} impact
                  </small>
                </div>
                <ChevronRight size={14} />
              </Link>
            ))}
            <div className="scan-fixes-footer">
              <Button asChild variant="outline" className="w-full">
                <Link href="/recommendations">
                  View all recommendations
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
      <div className="scan-bottom-note">
        <ShieldNote />
        Production-safe simulation. No live purchases or customer data were used during this scan.
      </div>
    </>
  );
}
function GlobeSmall() {
  return <span className="live-dot" />;
}
function ShieldNote() {
  return <CheckCircle2 size={14} />;
}
