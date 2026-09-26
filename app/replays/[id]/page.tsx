import { ReplayPage } from '@/components/sessions/replay-page';
import { sessions } from '@/lib/mock-data/sessions';
import { notFound } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = sessions.find((s) => s.id === id);
  if (!session) notFound();
  return <ReplayPage session={session} />;
}
