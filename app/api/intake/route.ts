import { NextResponse } from 'next/server';
import { buildIntakeContext } from '@/lib/agent/intake';

// Intake stage. Replace the body of buildIntakeContext with an intake LLM
// later; the response contract (IntakeContext) stays identical.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { query?: string };
  const context = await buildIntakeContext(String(body.query ?? ''));
  return NextResponse.json(context);
}