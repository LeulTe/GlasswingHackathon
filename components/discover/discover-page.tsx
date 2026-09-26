'use client';
import { GatewayWorkflow } from '@/components/gateway/workflow';
import { GatewayLogo } from '@/components/layout/app-shell';
import { productConfig } from '@/lib/mock-data/merchant';
import Link from 'next/link';
export function DiscoverPage() {
  return (
    <div className="portal-page">
      <header className="portal-brand">
        <Link className="portal-logo" href="/dashboard">
          <GatewayLogo />
          <strong>{productConfig.name}</strong>
        </Link>
        <span className="portal-brand-note">Autonomous shopper testing</span>
      </header>
      <section className="discover-hero">
        <div className="discover-eyebrow">Storefront testing</div>
        <h1>Understand your storefront through your shoppers.</h1>
        <p>
          Inspect an authorized storefront, review evidence-backed customer hypotheses and shopping
          goals, then observe isolated agents attempting them.
        </p>
      </section>
      <GatewayWorkflow />
    </div>
  );
}
