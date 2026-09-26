'use client';
import { GatewayLogo } from '@/components/layout/app-shell';
import { Button, Select, StatusBadge } from '@/components/ui/primitives';
import { directory } from '@/lib/mock-data/directory';
import { productConfig } from '@/lib/mock-data/merchant';
import { Bot, Search, Sparkles, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProviderInfo {
  id: string;
  label: string;
  description: string;
  model: string;
  configured: boolean;
}

export function DiscoverPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [provider, setProvider] = useState('sciforium');
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    fetch('/api/agent-scan')
      .then((response) => response.json())
      .then((payload: { providers: ProviderInfo[]; defaultProvider: string }) => {
        setProviders(payload.providers);
        setProvider(payload.defaultProvider);
      })
      .catch(() => undefined);
  }, []);

  const startScan = (value?: string) => {
    const term = (value ?? query).trim();
    if (!term) return;
    router.push(`/scanning?q=${encodeURIComponent(term)}&provider=${encodeURIComponent(provider)}`);
  };

  const activeProvider = providers.find((item) => item.id === provider);

  return (
    <div className="portal-page">
      <header className="portal-brand">
        <span className="portal-logo">
          <GatewayLogo />
          <strong>{productConfig.name}</strong>
        </span>
        <span className="portal-brand-note">Agent readiness · demo workspace</span>
      </header>

      <section className="discover-hero">
        <div className="discover-eyebrow">
          <Sparkles size={13} />
          Agentic storefront scan
        </div>
        <h1>Search a storefront. Send in the buyer agents.</h1>
        <p>
          Enter a merchant domain or a product goal. You’ll be taken to a live scan while an intake
          stage builds shared context and multiple buyer agents shop it in parallel — then straight
          into the storefront dashboard.
        </p>

        <div className="portal-controls">
          <div className="discover-search">
            <Search size={18} />
            <input
              autoFocus
              placeholder="evertrailoutdoors.com or “hiking backpack under $250”"
              aria-label="Search storefronts"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') startScan();
              }}
            />
            {query && (
              <button aria-label="Clear search" onClick={() => setQuery('')}>
                <X size={15} />
              </button>
            )}
          </div>
          <div className="portal-control-side">
            <label className="portal-provider">
              <span>Model API</span>
              <Select
                label="Model API"
                value={provider}
                onChange={setProvider}
                options={providers.map((item) => ({
                  value: item.id,
                  label: `${item.label}${item.configured ? '' : ' · no key'}`,
                }))}
              />
            </label>
            <Button onClick={() => startScan()} disabled={!query.trim()}>
              <Bot size={15} />
              Start scan
            </Button>
          </div>
        </div>

        {activeProvider && (
          <p className="portal-provider-note">
            {activeProvider.configured ? (
              <StatusBadge tone="green">live · {activeProvider.model}</StatusBadge>
            ) : (
              <StatusBadge tone="amber">
                {activeProvider.label} has no key · runs scripted against the reference store
              </StatusBadge>
            )}
          </p>
        )}

        <div className="discover-suggestions">
          <span>Indexed storefronts</span>
          {directory.slice(0, 5).map((site) => (
            <button key={site.id} onClick={() => startScan(site.domain)}>
              {site.domain}
            </button>
          ))}
        </div>
      </section>

      <p className="portal-hint">
        Your scan runs on the next page, then opens the storefront dashboard automatically.
      </p>
    </div>
  );
}