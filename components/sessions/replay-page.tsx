'use client';
import { useApp } from '@/components/layout/app-provider';
import { SecurityPolicyList } from '@/components/security/security-policy-list';
import { PageHeading } from '@/components/ui/page-heading';
import { Button, Card, CardHeader, Dialog, StatusBadge, Tabs } from '@/components/ui/primitives';
import { getSessionEvents } from '@/lib/mock-data/sessions';
import type { ShoppingSession } from '@/lib/types';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Fingerprint,
  LockKeyhole,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Target,
  Terminal,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AgentTimeline } from './agent-timeline';
export function ReplayPage({ session }: { session: ShoppingSession }) {
  const events = useMemo(() => getSessionEvents(session), [session]);
  const [tab, setTab] = useState('Timeline');
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(0);
  const [allEvents, setAllEvents] = useState(false);
  const { notify } = useApp();
  const featured = session.id === 'SES-10482';
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(
      () =>
        setStep((s) => {
          if (s >= events.length) {
            setPlaying(false);
            return s;
          }
          return s + 1;
        }),
      800,
    );
    return () => clearInterval(t);
  }, [playing, events.length]);
  const exportTrace = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ session, events }, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.id}-trace.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Session trace exported.');
  };
  return (
    <>
      <Link href="/sessions" className="back-link">
        <ArrowLeft size={13} />
        All shopping sessions
      </Link>
      <PageHeading
        title="Agent Replay"
        subtitle="Inspect how an autonomous shopper interpreted and interacted with the storefront."
        action={
          <Button variant="outline" onClick={exportTrace}>
            <Download size={14} />
            Export trace
          </Button>
        }
      />
      <Card className="replay-metadata">
        <div>
          <span>SESSION</span>
          <strong className="mono">{session.id}</strong>
        </div>
        <div>
          <span>STOREFRONT</span>
          <strong>Evertrail Outdoors</strong>
        </div>
        <div>
          <span>STARTED</span>
          <strong>
            Sep {session.date.slice(-2)}, 2026 · {session.timestamp}
          </strong>
        </div>
        <div>
          <span>DURATION</span>
          <strong className="mono">
            {featured ? '34.2' : session.duration} {featured && 'sec'}
          </strong>
        </div>
        <div>
          <span>STATUS</span>
          <StatusBadge
            tone={session.status === 'Completed' ? (session.issues ? 'amber' : 'green') : 'red'}
          >
            {session.status === 'Completed' && session.issues
              ? 'Completed with warnings'
              : session.status}
          </StatusBadge>
        </div>
      </Card>
      <div className="replay-layout">
        <Card className="replay-main">
          <CardHeader
            title="Shopping agent session"
            icon={
              <span className="section-icon">
                <Terminal size={15} />
              </span>
            }
            action={<span className="subtle-badge">{session.agent}</span>}
          />
          <div className="customer-goal">
            <span>
              <Target size={14} />
              CUSTOMER GOAL
            </span>
            <p>
              “
              {featured
                ? 'Find a hiking backpack under $250 suitable for a 3-day trip and purchase the best-rated option.'
                : session.goal}
              ”
            </p>
            <div>
              <span>
                <Wallet size={12} />
                {featured ? 'Budget ≤ $250' : session.goalType}
              </span>
              <span>
                <ShieldCheck size={12} />
                Intent recorded
              </span>
              <span>
                <span className="live-dot" />
                {session.environment}
              </span>
            </div>
          </div>
          <div className="replay-controls">
            <Tabs tabs={['Timeline', 'Requests', 'Agent context']} active={tab} onChange={setTab} />
            <div>
              <button
                aria-label="Reset replay"
                onClick={() => {
                  setPlaying(false);
                  setStep(0);
                }}
              >
                <RotateCcw size={13} />
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (step >= events.length) setStep(0);
                  setPlaying((p) => !p);
                }}
              >
                {playing ? <Pause size={12} /> : <Play size={12} />}
                {playing ? 'Pause' : 'Replay'}
              </Button>
            </div>
          </div>
          <div className="playback-track">
            <span style={{ width: `${(step / events.length) * 100}%` }} />
          </div>
          {tab === 'Timeline' ? (
            <AgentTimeline events={events} activeStep={step} />
          ) : tab === 'Requests' ? (
            <div className="request-list">
              {events
                .filter((e) => e.action)
                .map((e) => (
                  <div key={e.id}>
                    <span className="mono">{e.time}s</span>
                    <code>{e.action}</code>
                    <p>{e.details}</p>
                  </div>
                ))}
            </div>
          ) : (
            <div className="agent-context">
              <h3>Shopping session context</h3>
              <dl>
                <div>
                  <dt>Agent profile</dt>
                  <dd>{session.agent}</dd>
                </div>
                <div>
                  <dt>Intent reference</dt>
                  <dd className="mono">int_a7f92_{session.id.slice(-5)}</dd>
                </div>
                <div>
                  <dt>Environment</dt>
                  <dd>{session.environment}</dd>
                </div>
                <div>
                  <dt>Execution mode</dt>
                  <dd>Production-safe simulation</dd>
                </div>
                <div>
                  <dt>Goal type</dt>
                  <dd>{session.goalType}</dd>
                </div>
                <div>
                  <dt>Payment capture</dt>
                  <dd>Disabled</dd>
                </div>
              </dl>
              <div className="info-panel">
                <ShieldCheck size={17} />
                <span>
                  Decision summaries describe the agent’s observed choices and task constraints.
                </span>
              </div>
            </div>
          )}
          <div className="replay-complete">
            <Check size={14} />
            <span>
              {session.status === 'Completed'
                ? 'Session complete'
                : `Session ${session.status.toLowerCase()}`}
              <span>·</span>
              {session.steps} steps<span>·</span>
              {session.issues} {session.issues === 1 ? 'issue' : 'issues'} detected
            </span>
            <span className="mono">{session.duration}</span>
          </div>
        </Card>
        <div className="replay-sidebar">
          <Card>
            <CardHeader title="Security analysis" icon={<ShieldCheck size={16} />} />
            <div className="security-checks">
              {[
                { icon: Fingerprint, title: 'Verified agent identity', status: 'Verified' },
                {
                  icon: Target,
                  title: 'User intent',
                  status: session.status === 'Blocked' ? 'Enforced' : 'Verified',
                },
                { icon: Wallet, title: 'Spending limit', status: 'Within limit' },
                {
                  icon: ShoppingBag,
                  title: 'Order confirmation',
                  status: featured ? 'Needs attention' : 'Evaluated',
                },
              ].map((c) => (
                <div key={c.title}>
                  <c.icon size={15} />
                  <span>{c.title}</span>
                  <StatusBadge dot={false}>{c.status}</StatusBadge>
                </div>
              ))}
            </div>
            <div className="security-check-footer">
              <LockKeyhole size={11} />
              <span>Evaluated against merchant policy v1.4</span>
            </div>
          </Card>
          <Card>
            <CardHeader
              title="Merchant security policy"
              action={
                <Link href="/security" className="text-link">
                  Manage
                  <ArrowRight size={12} />
                </Link>
              }
            />
            {featured ? (
              <SecurityPolicyList />
            ) : (
              <div className="other-session-policy">
                <p>Policies were evaluated for the actions in this session.</p>
                <div>
                  <ShieldCheck size={16} />
                  <strong>
                    {session.status === 'Blocked'
                      ? 'Unsafe action blocked before execution'
                      : 'User intent preserved'}
                  </strong>
                </div>
                <Link href="/security" className="text-link">
                  Review policy configuration
                  <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </Card>
          <div className="security-success">
            <span className="security-success-icon">
              <ShieldCheck size={23} />
            </span>
            <h3>
              {session.status === 'Failed'
                ? 'Your session stayed safe'
                : 'Your policies are working'}
            </h3>
            <p>
              {featured
                ? '1 potentially risky action was blocked. The agent stayed within the configured purchasing intent.'
                : session.status === 'Blocked'
                  ? 'The action was stopped before execution. No unauthorized purchase or modification was made.'
                  : 'No unauthorized actions were executed. Customer intent remained protected throughout the session.'}
            </p>
            <button onClick={() => setAllEvents(true)}>
              View all events
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="replay-note">
            <LockKeyhole size={13} />
            <p>This is a simulated shopping session. No live orders or payments were processed.</p>
          </div>
        </div>
      </div>
      <Dialog
        open={allEvents}
        onOpenChange={setAllEvents}
        title={`Security events · ${session.id}`}
        description="Policy decisions captured during this shopping session."
      >
        <div className="event-dialog-list">
          {events
            .filter((e) => ['warning', 'promo', 'goal', 'complete'].includes(e.type))
            .map((e) => (
              <div key={e.id}>
                <span className="mono">{e.time}s</span>
                <div>
                  <strong>{e.title}</strong>
                  <p>{e.details}</p>
                </div>
              </div>
            ))}
        </div>
      </Dialog>
    </>
  );
}
