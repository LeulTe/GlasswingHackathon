'use client';
import { useApp } from '@/components/layout/app-provider';
import { IntegrationCard } from '@/components/ui/integration-card';
import { PageHeading } from '@/components/ui/page-heading';
import { Card, EmptyState, Select } from '@/components/ui/primitives';
import { ciCommand, integrations } from '@/lib/mock-data/integrations';
import { Check, Copy, Search, Terminal } from 'lucide-react';
import { useState } from 'react';
export default function IntegrationsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All integrations');
  const { notify } = useApp();
  const visible = integrations.filter(
    (i) =>
      (category === 'All integrations' || i.category === category) &&
      `${i.name} ${i.description}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        title="Integrations"
        subtitle="Connect Gateway to the commerce infrastructure you already use."
        action={
          <span className="subtle-badge">
            <span className="live-dot" />3 active connections
          </span>
        }
      />
      <div className="integrations-toolbar">
        <div className="search-field">
          <Search size={15} />
          <input
            aria-label="Search integrations"
            placeholder="Search integrations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <Select
          label="Integration category"
          value={category}
          onChange={setCategory}
          options={[
            'All integrations',
            'Commerce',
            'Payments',
            'Infrastructure',
            'Development',
            'Observability',
          ]}
        />
      </div>
      <div className="integrations-grid">
        {visible.map((i) => (
          <IntegrationCard key={i.name} integration={i} />
        ))}
      </div>
      {!visible.length && (
        <Card>
          <EmptyState title="No integrations found" />
        </Card>
      )}
      <Card className="ci-card">
        <div className="ci-description">
          <span className="icon-box blue">
            <Terminal size={22} />
          </span>
          <h2>Run readiness scans in CI</h2>
          <p>
            Catch agent commerce regressions before they ship. Add a readiness gate to every
            deployment.
          </p>
          <div>
            <span>
              <Check size={13} />
              Test staging environments
            </span>
            <span>
              <Check size={13} />
              Set a minimum readiness score
            </span>
            <span>
              <Check size={13} />
              Block regressions before production
            </span>
          </div>
        </div>
        <div className="ci-code">
          <div>
            <span>
              <Terminal size={13} />
              Terminal
            </span>
            <button
              aria-label="Copy CI command"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(ciCommand);
                  notify('CI command copied to clipboard.');
                } catch {
                  notify('Select the command to copy it manually.');
                }
              }}
            >
              <Copy size={13} />
              Copy
            </button>
          </div>
          <pre>
            <span className="code-comment"># Run a scan against your staging storefront</span>
            {'\n'}
            {ciCommand}
          </pre>
          <span className="ci-code-note">
            Illustrative CLI · integration available when backend is connected
          </span>
        </div>
      </Card>
    </>
  );
}
