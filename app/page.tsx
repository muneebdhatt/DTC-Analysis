import Dashboard from '@/components/Dashboard';
import { fetchSnapshot } from '@/lib/data';

// Always render fresh. A cached dashboard is a screenshot with extra steps.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Page() {
  // Fetching on the server means the first paint already has real numbers —
  // no spinner, no empty tiles. The client takes over polling from there.
  const initial = await fetchSnapshot();
  return <Dashboard initial={initial} />;
}
