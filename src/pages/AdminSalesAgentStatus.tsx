import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';

/**
 * Staff-only diagnostic: does the SalesAgent connection actually work?
 *
 * Everything api/lib/salesagent.ts does was written by reading the
 * ORIGINAL Next.js site's source code — the endpoint paths, param names,
 * and response shapes are copied from real working code, not guessed.
 * But none of it has ever been exercised against the live API: this
 * sandbox's network blocks mbwholesale.salesgenterp.com outright, so
 * every check that came before this page could only confirm the request
 * gets *built* correctly, never that SalesAgent *responds* the way the
 * original code assumed. This page is the first place that can actually
 * answer that, once it's deployed somewhere with real internet access.
 */
export default function AdminSalesAgentStatus() {
  const { user, isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const isAdmin = user?.role === 'admin';

  const categories = trpc.products.salesAgentCategories.useQuery(undefined, { enabled: isAdmin });
  const brands = trpc.products.salesAgentBrands.useQuery(undefined, { enabled: isAdmin });
  const tags = trpc.products.salesAgentTags.useQuery(undefined, { enabled: isAdmin });

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  if (user && !isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-stone" />
        <h1 className="text-lg font-semibold text-ink">Not authorized</h1>
        <p className="text-sm text-stone">This page is only available to staff accounts.</p>
        <Link to="/account" className="text-sm font-medium text-brand-accent underline">
          Back to your account
        </Link>
      </div>
    );
  }

  const overallOk = categories.data?.error == null && brands.data?.error == null && tags.data?.error == null;
  const anyLoaded = categories.data || brands.data || tags.data;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-ink">SalesAgent Connection Status</h1>
      <p className="mt-1 text-sm text-stone">
        Checks whether the website can actually reach your SalesAgent account right now.
      </p>

      {anyLoaded && (
        <div
          className={`mt-6 flex items-center gap-3 rounded-lg border px-4 py-3 ${
            overallOk ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          {overallOk ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <XCircle className="h-5 w-5 shrink-0 text-amber-700" />
          )}
          <p className="text-sm font-medium">
            {overallOk
              ? 'Connected — SalesAgent is responding with real data.'
              : "Not connected yet — see which check failed below, and what it says."}
          </p>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <CheckRow
          label="Categories"
          endpoint="GET /menu"
          isLoading={categories.isLoading}
          error={categories.data?.error}
          count={categories.data?.categories.length}
          sample={categories.data?.categories.slice(0, 5).map((c) => c.name)}
        />
        <CheckRow
          label="Brands"
          endpoint="GET /brand/list"
          isLoading={brands.isLoading}
          error={brands.data?.error}
          count={brands.data?.data.length}
          sample={brands.data?.data.slice(0, 5).map((b) => b.name)}
        />
        <CheckRow
          label="Deal Tags"
          endpoint="GET /home/productTagList"
          isLoading={tags.isLoading}
          error={tags.data?.error}
          count={tags.data?.data.length}
          sample={tags.data?.data.slice(0, 5).map((t) => t.name)}
        />
      </div>

      <div className="mt-8 rounded-lg border border-line bg-paper-2 px-4 py-4 text-sm text-stone">
        <p className="font-semibold text-ink">If every check above shows an error:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Confirm the business/store IDs — <code className="text-xs">businessTypeId=1</code> and{' '}
            <code className="text-xs">storeId=2</code> were inferred from the original site's code,
            not confirmed against your live account.
          </li>
          <li>Confirm your SalesAgent account is active and the API is reachable from the public internet.</li>
          <li>
            The exact error message below each check is the real reason — share it and we can
            narrow it down together.
          </li>
        </ul>
      </div>
    </div>
  );
}

function CheckRow({
  label,
  endpoint,
  isLoading,
  error,
  count,
  sample,
}: {
  label: string;
  endpoint: string;
  isLoading: boolean;
  error?: string;
  count?: number;
  sample?: string[];
}) {
  const ok = !isLoading && !error;
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-ink">{label}</p>
          <p className="font-mono text-[11px] text-stone">{endpoint}</p>
        </div>
        {isLoading ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-stone" />
        ) : ok ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            {count} found
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700">
            <XCircle className="h-4 w-4" />
            Failed
          </span>
        )}
      </div>
      {error && <p className="mt-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</p>}
      {ok && sample && sample.length > 0 && (
        <p className="mt-2 text-xs text-stone">Sample: {sample.join(', ')}</p>
      )}
    </div>
  );
}
