import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/providers/trpc';

/**
 * Standalone email/password sign in + wholesale account application —
 * replaced the original "Sign in with Kimi" OAuth button, which logged
 * people into a Kimi AI platform account. Real wholesale customers have
 * no reason to have one of those.
 *
 * Registration collects the full application in one submission (per
 * Ammar's spec) and does NOT log the person in — new accounts are
 * reviewed by staff before they can sign in. See api/auth-router.ts.
 */
export default function Login() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-16">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle>MB Wholesale</CardTitle>
          <CardDescription>Sign in or apply for a wholesale account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="register">Apply for an Account</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <div className="mx-auto max-w-sm">
                <SignInForm />
              </div>
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SignInForm() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      navigate('/account');
    },
  });

  return (
    <form
      className="mt-4 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        login.mutate({ email, password });
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="signin-email">Email</Label>
        <Input
          id="signin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourstore.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signin-password">Password</Label>
        <Input
          id="signin-password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {login.isError && (
        <Alert variant="destructive">
          <AlertDescription>{login.error.message}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" className="w-full" disabled={login.isPending}>
        {login.isPending ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  );
}

const BUSINESS_TYPES = [
  { value: 'c-store', label: 'Convenience Store' },
  { value: 'gas-station', label: 'Gas Station' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'smoke-shop', label: 'Smoke Shop' },
  { value: 'market', label: 'Market' },
  { value: 'other', label: 'Other' },
] as const;

const emptyForm = {
  firstName: '', lastName: '', email: '', password: '', phone: '',
  company: '', dbaName: '', businessType: '',
  address1: '', address2: '', city: '', state: '', zip: '', county: '',
  taxId: '', feinNumber: '', tobaccoId: '', tobaccoLicenseExpiration: '',
  cigaretteId: '', cigaretteLicenseExpiration: '',
  vaporTaxId: '', vaporTaxExpiration: '',
  salesTaxId: '', salesTaxExpiration: '',
  hempLicenseNumber: '', hempLicenseExpiration: '',
  drivingLicenseNumber: '', bankName: '',
};

function RegisterForm() {
  const [form, setForm] = useState(emptyForm);
  const set = (field: keyof typeof emptyForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const register = trpc.auth.register.useMutation();

  if (register.isSuccess) {
    return (
      <div className="mt-6 flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <h3 className="text-lg font-semibold text-ink">Application submitted</h3>
        <p className="max-w-sm text-sm text-stone">{register.data.message}</p>
      </div>
    );
  }

  return (
    <form
      className="mt-4 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        register.mutate({
          ...form,
          businessType: (form.businessType || undefined) as never,
          dbaName: form.dbaName || undefined,
          address2: form.address2 || undefined,
          county: form.county || undefined,
          country: 'US',
          tobaccoLicenseExpiration: form.tobaccoLicenseExpiration || undefined,
          cigaretteId: form.cigaretteId || undefined,
          cigaretteLicenseExpiration: form.cigaretteLicenseExpiration || undefined,
          vaporTaxId: form.vaporTaxId || undefined,
          vaporTaxExpiration: form.vaporTaxExpiration || undefined,
          salesTaxId: form.salesTaxId || undefined,
          salesTaxExpiration: form.salesTaxExpiration || undefined,
          hempLicenseNumber: form.hempLicenseNumber || undefined,
          hempLicenseExpiration: form.hempLicenseExpiration || undefined,
          drivingLicenseNumber: form.drivingLicenseNumber || undefined,
          bankName: form.bankName || undefined,
        });
      }}
    >
      <p className="text-sm text-stone">
        We review new wholesale accounts within 1-2 business days to confirm you're a real
        business with valid licenses. Fields marked <span className="text-red-500">*</span> are
        required.
      </p>

      <section className="space-y-4">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-stone">
          Owner / Manager
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name" required htmlFor="reg-first">
            <Input id="reg-first" required value={form.firstName} onChange={set('firstName')} />
          </Field>
          <Field label="Last Name" required htmlFor="reg-last">
            <Input id="reg-last" required value={form.lastName} onChange={set('lastName')} />
          </Field>
          <Field label="Email" required htmlFor="reg-email">
            <Input id="reg-email" type="email" required value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Phone" required htmlFor="reg-phone">
            <Input id="reg-phone" type="tel" required value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Password" required htmlFor="reg-password">
            <Input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={set('password')}
            />
          </Field>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-stone">Company</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company (as shown on Tax ID)" required htmlFor="reg-company">
            <Input id="reg-company" required value={form.company} onChange={set('company')} />
          </Field>
          <Field label="DBA Name" htmlFor="reg-dba">
            <Input id="reg-dba" value={form.dbaName} onChange={set('dbaName')} />
          </Field>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Business Type</Label>
            <Select
              value={form.businessType}
              onValueChange={(v) => setForm((f) => ({ ...f, businessType: v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-stone">Address</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address" required htmlFor="reg-address1" className="sm:col-span-2">
            <Input id="reg-address1" required value={form.address1} onChange={set('address1')} />
          </Field>
          <Field label="Address 2" htmlFor="reg-address2" className="sm:col-span-2">
            <Input id="reg-address2" value={form.address2} onChange={set('address2')} />
          </Field>
          <Field label="City" required htmlFor="reg-city">
            <Input id="reg-city" required value={form.city} onChange={set('city')} />
          </Field>
          <Field label="State" required htmlFor="reg-state">
            <Input id="reg-state" required maxLength={2} placeholder="IN" value={form.state} onChange={set('state')} />
          </Field>
          <Field label="ZIP" required htmlFor="reg-zip">
            <Input id="reg-zip" required value={form.zip} onChange={set('zip')} />
          </Field>
          <Field label="County" htmlFor="reg-county">
            <Input id="reg-county" value={form.county} onChange={set('county')} />
          </Field>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-stone">
          Tax &amp; License IDs
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tax ID" required htmlFor="reg-taxid">
            <Input id="reg-taxid" required value={form.taxId} onChange={set('taxId')} />
          </Field>
          <Field label="FEIN Number" required htmlFor="reg-fein">
            <Input id="reg-fein" required value={form.feinNumber} onChange={set('feinNumber')} />
          </Field>
          <Field label="Tobacco License Number" required htmlFor="reg-tobacco">
            <Input id="reg-tobacco" required value={form.tobaccoId} onChange={set('tobaccoId')} />
          </Field>
          <Field label="Tobacco License Expiration" htmlFor="reg-tobacco-exp">
            <Input id="reg-tobacco-exp" type="date" value={form.tobaccoLicenseExpiration} onChange={set('tobaccoLicenseExpiration')} />
          </Field>
          <Field label="Cigarette ID" htmlFor="reg-cig">
            <Input id="reg-cig" value={form.cigaretteId} onChange={set('cigaretteId')} />
          </Field>
          <Field label="Cigarette License Expiration" htmlFor="reg-cig-exp">
            <Input id="reg-cig-exp" type="date" value={form.cigaretteLicenseExpiration} onChange={set('cigaretteLicenseExpiration')} />
          </Field>
          <Field label="Vapor Tax ID" htmlFor="reg-vapor">
            <Input id="reg-vapor" value={form.vaporTaxId} onChange={set('vaporTaxId')} />
          </Field>
          <Field label="Vapor Tax Expiration" htmlFor="reg-vapor-exp">
            <Input id="reg-vapor-exp" type="date" value={form.vaporTaxExpiration} onChange={set('vaporTaxExpiration')} />
          </Field>
          <Field label="Sales Tax ID" htmlFor="reg-sales">
            <Input id="reg-sales" value={form.salesTaxId} onChange={set('salesTaxId')} />
          </Field>
          <Field label="Sales Tax Expiration" htmlFor="reg-sales-exp">
            <Input id="reg-sales-exp" type="date" value={form.salesTaxExpiration} onChange={set('salesTaxExpiration')} />
          </Field>
          <Field label="Hemp License Number" htmlFor="reg-hemp">
            <Input id="reg-hemp" value={form.hempLicenseNumber} onChange={set('hempLicenseNumber')} />
          </Field>
          <Field label="Hemp License Expiration" htmlFor="reg-hemp-exp">
            <Input id="reg-hemp-exp" type="date" value={form.hempLicenseExpiration} onChange={set('hempLicenseExpiration')} />
          </Field>
          <Field label="Driving License Number" htmlFor="reg-dl">
            <Input id="reg-dl" value={form.drivingLicenseNumber} onChange={set('drivingLicenseNumber')} />
          </Field>
          <Field label="Bank Name" htmlFor="reg-bank">
            <Input id="reg-bank" value={form.bankName} onChange={set('bankName')} />
          </Field>
        </div>
      </section>

      {register.isError && (
        <Alert variant="destructive">
          <AlertDescription>{register.error.message}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={register.isPending}>
        {register.isPending ? 'Submitting…' : 'Submit Application'}
      </Button>
    </form>
  );
}

function Field({
  label,
  required,
  htmlFor,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </Label>
      {children}
    </div>
  );
}
