import type { Metadata } from 'next';
import Dashboard from '@/components/Dashboard';
import { fetchSnapshot } from '@/lib/data';
import { resolveVariant } from '@/dashboard.config';

// Always render fresh. A cached dashboard is a screenshot with extra steps.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Search = Promise<{ variant?: string }>;

// Title and description follow the active board, so a link shared with a
// buyer names their business, not the default lead.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Search;
}): Promise<Metadata> {
  const { variant } = await searchParams;
  const config = resolveVariant(variant);
  return {
    title: `${config.brand.name} — ${config.brand.eyebrow}`,
  };
}

export default async function Page({ searchParams }: { searchParams: Search }) {
  // `?variant=` picks the board (falling back to the env default), so one
  // build and one data row serve every buyer in the cluster.
  const { variant } = await searchParams;
  const config = resolveVariant(variant);

  // Fetching on the server means the first paint already has real numbers —
  // no spinner, no empty tiles. The client takes over polling from there.
  const initial = await fetchSnapshot(config);

  return <Dashboard config={config} initial={initial} />;
}
