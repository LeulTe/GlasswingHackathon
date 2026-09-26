'use client';
import { ChartCard, ReadinessTrendChart } from '@/components/charts/charts';
import { FindingRow } from '@/components/dashboard/finding-row';
import { ReadinessCard } from '@/components/dashboard/readiness-card';
import { ScoreRing } from '@/components/dashboard/score-ring';
import { useApp } from '@/components/layout/app-provider';
import { ScanButton } from '@/components/layout/app-shell';
import { PageHeading } from '@/components/ui/page-heading';
import { Button, Card, CardHeader } from '@/components/ui/primitives';
import { getCheckoutMetric } from '@/lib/checkout';
import { getCompatibilityMetric } from '@/lib/compatibility';
import { getDiscoveryMetric } from '@/lib/discovery';
import { getTopFindings } from '@/lib/findings';
import { merchant } from '@/lib/mock-data/merchant';
import { recommendations as initialRecommendations } from '@/lib/mock-data/recommendations';
import { findings as initialFindings, readinessMetrics } from '@/lib/mock-data/scans';
import { getNextSteps } from '@/lib/next-steps';
import { getReadinessTrend, mockReadinessTrendResult, toChartData } from '@/lib/readiness-trend';
import { getSecurityMetric } from '@/lib/security';
import type { Finding, ReadinessMetric, ReadinessTrendScanResult, Recommendation } from '@/lib/types';
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCheck,
  ChevronRight,
  Code2,
  Globe2,
  Layers3,
  Mountain,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
const metricFetchers: Record<ReadinessMetric['icon'], () => Promise<ReadinessMetric>> = {
  discovery: getDiscoveryMetric,
  checkout: getCheckoutMetric,
  security: getSecurityMetric,
  compatibility: getCompatibilityMetric,
};
export default function Dashboard() {
  const { lastScanned, scanNumber, environment, scanSite } = useApp();
  const [categoryMetrics, setCategoryMetrics] = useState<ReadinessMetric[]>(readinessMetrics);
  const [findings, setFindings] = useState<Finding[]>(initialFindings);
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const [trend, setTrend] = useState<ReadinessTrendScanResult>(mockReadinessTrendResult);
  useEffect(() => {
    let cancelled = false;
    Promise.all(categoryMetrics.map((m) => metricFetchers[m.icon]())).then((metrics) => {
      if (!cancelled) setCategoryMetrics(metrics);
    });
    getTopFindings().then((result) => {
      if (!cancelled) setFindings(result);
    });
    getNextSteps().then((result) => {
      if (!cancelled) setRecommendations(result);
    });
    getReadinessTrend().then((result) => {
      if (!cancelled) setTrend(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const trendPoints = trend.points;
  const latestScore = trendPoints.at(-1)?.score ?? 0;
  const trendChange = latestScore - (trendPoints[0]?.score ?? latestScore);
  return (
    <>
      <PageHeading
        title="Good morning, Jordan"
        subtitle={
          scanSite
            ? `Here's how ${scanSite.domain} is performing for autonomous shoppers.`
            : "Here's how evertrailoutdoors.com is performing for autonomous shoppers."
        }
        action={
          <>
            <div className="last-scanned">
              <span>Last scanned</span>
              <strong>{scanSite?.scannedAt ?? lastScanned}</strong>
            </div>
            <ScanButton outline />
          </>
        }
      />
      {scanSite && (
        <div className="scan-banner">
          <span className="icon-box blue">
            <Bot size={17} />
          </span>
          <div>
            <strong>
              Live agent scan · {scanSite.name} ({scanSite.domain})
            </strong>
            <p>
              {scanSite.succeeded} of {scanSite.goalCount} shopping goals completed · readiness{' '}
              {scanSite.score}/100 · {scanSite.mode}
              {scanSite.model ? ` · ${scanSite.model}` : ''}
            </p>
          </div>
          <Link href="/discover">
            Run another scan
            <ArrowRight size={13} />
          </Link>
        </div>
      )}
      <Card className="readiness-overview">
        <CardHeader
          title="Agent readiness overview"
          icon={
            <span className="section-icon">
              <ActivityIcon />
            </span>
          }
          action={
            <span className="scan-id">
              <span className="live-dot" />
              Scan #{String(scanNumber).padStart(4, '0')}
              <span className="muted">·</span>
              {environment}
            </span>
          }
        />
        <div className="readiness-overview-body">
          <ScoreRing score={scanSite?.score ?? 74} />
          <div className="readiness-summary">
            <div className="improvement">
              <TrendingUp size={13} />
              13 points higher than your first scan
            </div>
            <h2>Good foundation — room to improve</h2>
            <p>
              Your site is mostly accessible to autonomous shoppers, but several product, checkout,
              and policy issues may reduce successful purchases.
            </p>
            <div className="readiness-legend">
              <span>
                <i className="green" />
                Mostly ready
              </span>
              <span>
                <i className="amber" />
                Needs work
              </span>
              <span>
                <i className="blue" />
                High opportunity
              </span>
            </div>
          </div>
          <div className="merchant-preview">
            <div className="merchant-photo">
              <div className="merchant-photo-overlay">
                <Mountain size={17} />
                <span>
                  EVERTRAIL<span>OUTDOORS</span>
                </span>
              </div>
              <span className="merchant-photo-caption">Made for the way out.</span>
              <span className="photo-credit">STOREFRONT PREVIEW</span>
            </div>
            <div className="merchant-preview-content">
              <div>
                <strong>{merchant.name}</strong>
                <ArrowUpRight size={12} />
              </div>
              <p>{merchant.description}</p>
              <div className="merchant-stats">
                <span>
                  <strong>72</strong> products detected
                </span>
                <span>
                  <strong>6</strong> brands
                </span>
                <span>
                  <strong>3</strong> product categories
                </span>
                <span>
                  <strong>3</strong> shopping flows
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="overview-card-footer">
          <span>
            <CheckCheck size={13} />
            86 pages analyzed<span>·</span>48 shopping sessions<span>·</span>5 agent profiles
          </span>
          <Link href="/scan">
            View full scan report
            <ArrowRight size={13} />
          </Link>
        </div>
      </Card>
      <div className="section-label">
        <h2>Readiness by category</h2>
        <span>Compared with previous scan</span>
      </div>
      <div className="readiness-grid">
        {categoryMetrics.map((metric) => (
          <ReadinessCard key={metric.name} metric={metric} />
        ))}
      </div>
      <div className="dashboard-lower">
        <Card className="top-findings">
          <CardHeader
            title="Top findings"
            action={
              <Link href="/scan" className="text-link">
                View all
                <ArrowRight size={13} />
              </Link>
            }
          />
          <div className="findings-subhead">
            <span>PRIORITIZED BY IMPACT</span>
            <span>{findings.length} open issues</span>
          </div>
          {findings.map((finding, i) => (
            <FindingRow key={finding.id} finding={finding} index={i} />
          ))}
          <div className="findings-footer">
            <ShieldCheck size={14} />
            <span>Fix the highest-impact issues to improve agent task success.</span>
          </div>
        </Card>
        <ChartCard
          title="Agent readiness trend"
          action={<span className="subtle-badge">Last 5 scans</span>}
          className="readiness-trend"
        >
          <div className="trend-value">
            <strong>
              {latestScore}
              <span>/ 100</span>
            </strong>
            <span className={trendChange >= 0 ? 'positive' : 'negative'}>
              <TrendingUp size={13} />
              {trendChange >= 0 ? '+' : ''}
              {trendChange} points
            </span>
          </div>
          <ReadinessTrendChart data={toChartData(trend)} />
          <div className="chart-caption">
            <span className="chart-key" />
            Readiness score
            <span className="chart-key target" />
            Target: {trend.target}
          </div>
          <p className="trend-caption">
            Readiness {trendChange >= 0 ? 'improved' : 'declined'}{' '}
            <strong>{Math.abs(trendChange)} points</strong> across the last {trendPoints.length}{' '}
            scans.
          </p>
        </ChartCard>
        <Card className="next-steps">
          <CardHeader
            title="Recommended next steps"
            action={
              <span className="subtle-badge">
                {Math.min(4, recommendations.length)} actions
              </span>
            }
          />
          <p className="next-steps-description">Small changes. More successful shoppers.</p>
          <div>
            {recommendations.slice(0, 4).map((r, i) => (
              <Link key={r.id} href={`/recommendations#${r.id}`} className="next-step">
                <span className="next-step-icon">
                  {i === 0 ? (
                    <Code2 size={16} />
                  ) : i === 1 ? (
                    <ShieldCheck size={16} />
                  ) : i === 2 ? (
                    <CheckCheck size={16} />
                  ) : (
                    <Globe2 size={16} />
                  )}
                </span>
                <span>
                  <strong>{r.title}</strong>
                  <small>
                    <span className={i < 2 ? 'impact-high' : 'impact-medium'} />
                    {i < 2 ? 'High' : 'Medium'} impact<span>·</span>
                    {r.effort} effort
                  </small>
                </span>
                <ChevronRight size={14} />
              </Link>
            ))}
          </div>
          <Button asChild className="w-full">
            <Link href="/recommendations">
              View all recommendations
              <ArrowRight size={14} />
            </Link>
          </Button>
        </Card>
      </div>
      <div className="activity-strip">
        <div>
          <span className="icon-box blue">
            <Layers3 size={17} />
          </span>
          <span>
            <strong>Your next customer might be an agent.</strong>
            <span>Know your storefront is ready before they arrive.</span>
          </span>
        </div>
        <Link href="/sessions">
          Explore shopping sessions
          <ArrowRight size={14} />
        </Link>
      </div>
    </>
  );
}
function ActivityIcon() {
  return <ShieldCheck size={16} />;
}
