'use client';
import { useApp } from '@/components/layout/app-provider';
import { RecommendationCard } from '@/components/recommendations/recommendation-card';
import { MetricCard } from '@/components/ui/metric-card';
import { PageHeading } from '@/components/ui/page-heading';
import { Card, EmptyState, Select, Tabs } from '@/components/ui/primitives';
import { recommendations as initialRecommendations } from '@/lib/mock-data/recommendations';
import { getNextSteps } from '@/lib/next-steps';
import type { Recommendation } from '@/lib/types';
import { ArrowUpRight, CheckCheck, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
export default function RecommendationsPage() {
  const [tab, setTab] = useState('Open');
  const [category, setCategory] = useState('All categories');
  const [recommendations, setRecommendations] = useState<Recommendation[]>(initialRecommendations);
  const { resolved } = useApp();
  useEffect(() => {
    let cancelled = false;
    getNextSteps().then((result) => {
      if (!cancelled) setRecommendations(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const visible = recommendations.filter(
    (r) =>
      (category === 'All categories' || category === r.category) &&
      (tab === 'All' || (tab === 'Resolved' ? resolved.includes(r.id) : !resolved.includes(r.id))),
  );
  return (
    <>
      <PageHeading
        title="Recommendations"
        subtitle="Merchant-side changes that improve autonomous shopping performance."
        action={
          <span className="subtle-badge">
            <span className="live-dot" />
            From scan #0025
          </span>
        }
      />
      <div className="metrics-grid">
        <MetricCard
          label="Open recommendations"
          value={String(12 - resolved.length)}
          detail="Prioritized by merchant impact"
        />
        <MetricCard
          label="Estimated readiness increase"
          value="+18"
          unit="points"
          detail="From all recommended changes"
        />
        <MetricCard
          label="High impact"
          value={String(5 - resolved.length)}
          detail="Address these recommendations first"
        />
        <MetricCard label="Quick wins" value="4" detail="Less than one day to implement" />
      </div>
      <div className="recommendations-layout">
        <div>
          <div className="recommendations-toolbar">
            <Tabs tabs={['Open', 'Resolved', 'All']} active={tab} onChange={setTab} />
            <Select
              label="Recommendation category"
              value={category}
              onChange={setCategory}
              options={['All categories', 'Product semantics', 'Security', 'Policies']}
            />
          </div>
          <div className="recommendations-list">
            {visible.map((r, i) => (
              <RecommendationCard recommendation={r} key={r.id} index={i} />
            ))}
            {!visible.length && (
              <Card>
                <EmptyState
                  title={
                    tab === 'Resolved'
                      ? 'No resolved recommendations yet'
                      : 'No matching recommendations'
                  }
                  description={
                    tab === 'Resolved'
                      ? 'Implement a recommendation and verify the fix to see it here.'
                      : 'Try a different category or open the All tab.'
                  }
                />
              </Card>
            )}
          </div>
          <p className="recommendations-footnote">
            Showing {visible.length} prioritized recommendations from the latest scan. 7 additional
            lower-priority recommendations are outside this demo.
          </p>
        </div>
        <aside className="recommendations-sidebar">
          <Card>
            <span className="icon-box blue">
              <TrendingUp size={21} />
            </span>
            <h3>Your path to agent readiness</h3>
            <p>Resolve these issues to help more autonomous shoppers complete their goals.</p>
            <div className="readiness-projection">
              <div>
                <span>Current score</span>
                <strong>74</strong>
              </div>
              <ArrowUpRight size={22} />
              <div>
                <span>Potential score</span>
                <strong>92</strong>
              </div>
            </div>
            <div className="progress-track">
              <span style={{ width: '74%' }} />
            </div>
            <small>
              Estimated across all 12 open recommendations. Individual impacts may overlap.
            </small>
          </Card>
          <Card className="verification-explainer">
            <span className="icon-box green">
              <CheckCheck size={19} />
            </span>
            <h3>Close the loop with verification</h3>
            <p>
              After applying a fix, run the same shopping scenarios again. Verify the outcome before
              closing the issue.
            </p>
            <ol>
              <li>
                <span>1</span>Review implementation
              </li>
              <li>
                <span>2</span>Apply the merchant-side fix
              </li>
              <li>
                <span>3</span>Run a verification
              </li>
            </ol>
          </Card>
        </aside>
      </div>
    </>
  );
}
