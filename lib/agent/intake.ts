import { buyerPersonas, defaultGoals, storefrontOrigin } from './personas';
import type { BuyerPersona, IntakeContext } from './contracts';

function normalizeUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

/**
 * Normalizes free-text search input into the shared buyer context.
 *
 * This is the intake seam: today it is a deterministic parser, but the same
 * signature can be backed by an intake LLM that asks clarifying questions and
 * emits the same IntakeContext. Nothing downstream changes when that happens.
 */
export async function buildIntakeContext(
  query: string,
  personas: BuyerPersona[] = buyerPersonas,
): Promise<IntakeContext> {
  const trimmed = query.trim();
  const urlMatch = trimmed.match(/((https?:\/\/)?[a-z0-9-]+(\.[a-z0-9-]+)+(?:\/\S*)?)/i);
  const storefrontUrl = urlMatch ? normalizeUrl(urlMatch[0]) : storefrontOrigin;
  const storefrontLabel = storefrontUrl.replace(/^https?:\/\//i, '');
  const budgetMatch = trimmed.match(/\$\s?(\d{2,5})|(\d{2,5})\s?(?:dollars|budget)/i);
  const budget = budgetMatch ? Number(budgetMatch[1] ?? budgetMatch[2]) : 250;
  const category = /apparel|jacket|clothing/i.test(trimmed)
    ? 'Apparel'
    : /backpack|pack|daypack/i.test(trimmed)
      ? 'Backpacks'
      : /tent|camp/i.test(trimmed)
        ? 'Camping'
        : /shoe|boot|footwear/i.test(trimmed)
          ? 'Footwear'
          : /bottle|accessor/i.test(trimmed)
            ? 'Accessories'
            : 'General';
  const rest = urlMatch ? trimmed.replace(urlMatch[0], '').trim() : trimmed;
  const goals = urlMatch && rest.length < 4 ? defaultGoals : [trimmed];
  return {
    storefrontUrl,
    storefrontLabel,
    category,
    region: 'US',
    budget,
    constraints: [
      `Budget ≤ $${budget}`,
      'Region: US',
      'Autonomous purchase allowed within budget',
    ],
    goals,
    personas,
    source: 'heuristic',
  };
}