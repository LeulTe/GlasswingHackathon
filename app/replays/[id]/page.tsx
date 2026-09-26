import { GatewayReplay } from '@/components/gateway/replay';
import { notFound } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  return <GatewayReplay id={id} />;
}
