import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, XCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { trpc } from '@/providers/trpc';

/**
 * Staff-only review queue for wholesale account applications submitted
 * through /login's "Apply for an Account" tab (see api/auth-router.ts and
 * api/admin.ts). Not linked from anywhere in the site nav on purpose —
 * it's an internal tool, not customer-facing.
 *
 * To become an admin in the first place: set the OWNER_UNION_ID
 * environment variable to your own email, then register a normal account
 * with that email — api/queries/users.ts auto-promotes and auto-approves
 * whoever matches that env var, since there's no other admin yet to
 * approve the first one.
 */
export default function AdminApplications() {
  const { user, isLoading: authLoading } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const applicationsQuery = trpc.admin.pendingApplications.useQuery(undefined, {
    enabled: user?.role === 'admin',
  });

  const approve = trpc.admin.approve.useMutation({
    onSuccess: () => utils.admin.pendingApplications.invalidate(),
  });
  const reject = trpc.admin.reject.useMutation({
    onSuccess: () => utils.admin.pendingApplications.invalidate(),
  });

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  if (user && user.role !== 'admin') {
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

  const applications = applicationsQuery.data ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-ink">Wholesale Applications</h1>
        <p className="mt-1 text-sm text-stone">
          {applicationsQuery.isLoading
            ? 'Loading…'
            : `${applications.length} application${applications.length === 1 ? '' : 's'} awaiting review.`}
        </p>
      </div>

      {applicationsQuery.isError && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {applicationsQuery.error.message}
        </p>
      )}

      {!applicationsQuery.isLoading && applications.length === 0 && !applicationsQuery.isError && (
        <p className="rounded-lg border border-line bg-paper-2 px-4 py-6 text-center text-sm text-stone">
          No pending applications right now.
        </p>
      )}

      <div className="space-y-4">
        {applications.map(({ user: applicant, profile }) => (
          <ApplicationCard
            key={applicant.id}
            applicant={applicant}
            profile={profile}
            onApprove={() => approve.mutate({ userId: applicant.id })}
            onReject={(note) => reject.mutate({ userId: applicant.id, note })}
            busy={approve.isPending || reject.isPending}
          />
        ))}
      </div>
    </div>
  );
}

type Applicant = { id: number; email: string | null; createdAt: string | Date };
type Profile = {
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  dbaName: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
  taxId: string;
  feinNumber: string;
  tobaccoId: string;
  cigaretteId: string | null;
  vaporTaxId: string | null;
  salesTaxId: string | null;
  hempLicenseNumber: string | null;
};

function ApplicationCard({
  applicant,
  profile,
  onApprove,
  onReject,
  busy,
}: {
  applicant: Applicant;
  profile: Profile;
  onApprove: () => void;
  onReject: (note?: string) => void;
  busy: boolean;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{profile.company}</CardTitle>
          {profile.dbaName && <p className="text-xs text-stone">DBA {profile.dbaName}</p>}
          <p className="mt-1 text-xs text-stone">
            Applied {new Date(applicant.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={onApprove} disabled={busy}>
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRejecting((r) => !r)}
            disabled={busy}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <Detail label="Owner / Manager" value={`${profile.firstName} ${profile.lastName}`} />
          <Detail label="Email" value={applicant.email ?? '—'} />
          <Detail label="Phone" value={profile.phone} />
          <Detail
            label="Address"
            value={`${profile.address1}${profile.address2 ? `, ${profile.address2}` : ''}, ${profile.city}, ${profile.state} ${profile.zip}`}
          />
          <Detail label="Tax ID" value={profile.taxId} />
          <Detail label="FEIN Number" value={profile.feinNumber} />
          <Detail label="Tobacco License #" value={profile.tobaccoId} />
          {profile.cigaretteId && <Detail label="Cigarette ID" value={profile.cigaretteId} />}
          {profile.vaporTaxId && <Detail label="Vapor Tax ID" value={profile.vaporTaxId} />}
          {profile.salesTaxId && <Detail label="Sales Tax ID" value={profile.salesTaxId} />}
          {profile.hempLicenseNumber && (
            <Detail label="Hemp License #" value={profile.hempLicenseNumber} />
          )}
        </div>

        {rejecting && (
          <div className="space-y-2 border-t border-line pt-3">
            <Textarea
              placeholder="Optional note for why this was rejected (the applicant may see this)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject(note || undefined)}
              disabled={busy}
            >
              Confirm Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-stone">{label}</p>
      <p className="text-ink">{value}</p>
    </div>
  );
}
