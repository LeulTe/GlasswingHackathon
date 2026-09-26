import type { AgentFinding, AgentScanResult } from './types';

/**
 * A synthetic buyer persona. The intake stage decides which personas run
 * against a storefront; the swarm orchestrator runs one agent per persona.
 * These are configs today but map 1:1 onto distinct LLM buyer agents.
 */
export interface BuyerPersona {
  id: string;
  name: string;
  short: string;
  color: string;
  goalBias: string;
  budgetStrictness: 'strict' | 'flexible';
  patience: 'low' | 'medium' | 'high';
  riskTolerance: 'low' | 'medium' | 'high';
}

/**
 * Shared context produced by the intake stage and consumed by every buyer
 * agent in the swarm. This is the single integration seam: an intake LLM
 * fills it in, and N buyer LLMs read from it.
 */
export interface IntakeContext {
  storefrontUrl: string;
  storefrontLabel: string;
  category: string;
  region: string;
  budget: number;
  constraints: string[];
  goals: string[];
  personas: BuyerPersona[];
  source: 'heuristic' | 'llm';
}

/** Request/response contract for the buyer-swarm endpoint. */
export interface SwarmResponse {
  provider: string;
  configured: boolean;
  storefront: string;
  mode: string;
  model: string | null;
  goalCount: number;
  succeeded: number;
  failed: number;
  personas: BuyerPersona[];
  results: AgentScanResult[];
  findings: AgentFinding[];
}