'use client';
import { useApp } from '@/components/layout/app-provider';
import { integrations } from '@/lib/mock-data/integrations';
import { Check, Plug, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Dialog, StatusBadge } from './primitives';
export function IntegrationCard({
  integration: i,
}: {
  integration: (typeof integrations)[number];
}) {
  const [status, setStatus] = useState(i.status);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(i.status === 'Available' ? '' : `Evertrail ${i.name}`);
  const [endpoint, setEndpoint] = useState(
    i.name === 'Shopify'
      ? 'evertrail-outdoors.myshopify.com'
      : i.name === 'GitHub'
        ? 'evertrail/storefront'
        : '',
  );
  const { notify } = useApp();
  return (
    <>
      <Card className="integration-card">
        <div className="integration-card-top">
          <span
            className={`integration-logo logo-${i.name.toLowerCase().replaceAll(' ', '-')}`}
            style={{ color: i.color, backgroundColor: `${i.color}0d` }}
          >
            {i.mark}
          </span>
          <StatusBadge
            tone={status === 'Available' ? 'neutral' : 'green'}
            dot={status !== 'Available'}
          >
            {status}
          </StatusBadge>
        </div>
        <h3>{i.name}</h3>
        <p>{i.description}</p>
        <div className="integration-card-footer">
          <span>
            {status === 'Connected' && i.status === 'Available'
              ? 'Connected just now · demo'
              : i.detail}
          </span>
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {status === 'Available' ? (
              <>
                <Plug size={12} />
                Connect
              </>
            ) : (
              <>
                <Settings2 size={12} />
                Configure
              </>
            )}
          </Button>
        </div>
      </Card>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={`${status === 'Available' ? 'Connect' : 'Configure'} ${i.name}`}
        description="Configure this integration in your demo workspace."
      >
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !endpoint.trim()) return;
            setStatus('Connected');
            setOpen(false);
            notify(`${i.name} configuration saved locally for this demo.`);
          }}
        >
          <label>
            Connection name
            <input
              value={name}
              required
              onChange={(e) => setName(e.target.value)}
              placeholder={`Evertrail ${i.name}`}
            />
          </label>
          <label>
            {i.name === 'GitHub'
              ? 'Repository'
              : i.name === 'Shopify'
                ? 'Store domain'
                : 'Account or endpoint'}
            <input
              value={endpoint}
              required
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder={
                i.name === 'GitHub' ? 'organization/repository' : 'Your account identifier'
              }
            />
          </label>
          <div className="info-panel">
            <Plug size={16} />
            <span>
              Configuration is simulated in this frontend demo. No credentials are collected or
              external services contacted.
            </span>
          </div>
          <div className="dialog-actions">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              <Check size={14} />
              Save connection
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
