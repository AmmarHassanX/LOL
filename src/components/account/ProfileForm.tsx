import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BUSINESS_TYPE_LABEL } from './utils';
import type { BusinessProfile } from './utils';

/** Indiana ZIPs are 5 digits beginning with 46 or 47. */
const profileSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(255),
  firstName: z.string().min(1, 'First name is required').max(255),
  lastName: z.string().min(1, 'Last name is required').max(255),
  phone: z.string().min(7, 'Enter a valid phone number').max(40),
  businessType: z.enum(['c-store', 'gas-station', 'restaurant', 'smoke-shop', 'market', 'other']),
  address1: z.string().min(1, 'Street address is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(2, 'State is required').max(2),
  zip: z
    .string()
    .regex(/^4[67]\d{3}$/, 'Indiana delivery only — ZIP must start with 46 or 47'),
  taxId: z.string().min(1, 'Tax ID is required').max(64),
  feinNumber: z.string().min(1, 'FEIN number is required').max(64),
  tobaccoId: z.string().min(1, 'Tobacco license number is required').max(64),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

const BUSINESS_TYPES = Object.keys(BUSINESS_TYPE_LABEL) as Array<ProfileFormValues['businessType']>;

interface ProfileFormProps {
  /** Existing profile when editing; undefined for first-time onboarding. */
  profile?: BusinessProfile | null;
  onSubmit: (values: ProfileFormValues) => void | Promise<void>;
  submitting?: boolean;
  submitLabel: string;
  onCancel?: () => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 font-mono text-[11px] tracking-wide text-[#B3261E]">{message}</p>;
}

const inputClass =
  'border-line bg-paper focus-visible:ring-amber placeholder:text-stone/60';

export default function ProfileForm({
  profile,
  onSubmit,
  submitting,
  submitLabel,
  onCancel,
}: ProfileFormProps) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      company: profile?.company ?? '',
      firstName: profile?.firstName ?? '',
      lastName: profile?.lastName ?? '',
      phone: profile?.phone ?? '',
      businessType: profile?.businessType ?? undefined,
      address1: profile?.address1 ?? '',
      city: profile?.city ?? '',
      state: profile?.state ?? '',
      zip: profile?.zip ?? '',
      taxId: profile?.taxId ?? '',
      feinNumber: profile?.feinNumber ?? '',
      tobaccoId: profile?.tobaccoId ?? '',
    },
  });

  // Keep the form in sync if the profile loads/changes after mount.
  useEffect(() => {
    if (!profile) return;
    reset({
      company: profile.company ?? '',
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      phone: profile.phone ?? '',
      businessType: profile.businessType ?? undefined,
      address1: profile.address1 ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      zip: profile.zip ?? '',
      taxId: profile.taxId ?? '',
      feinNumber: profile.feinNumber ?? '',
      tobaccoId: profile.tobaccoId ?? '',
    });
  }, [profile, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="pf-company" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Company Name
          </Label>
          <Input
            id="pf-company"
            placeholder="Hoosier Corner Market LLC"
            className={inputClass}
            {...register('company')}
          />
          <FieldError message={errors.company?.message} />
        </div>
        <div>
          <Label htmlFor="pf-first" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            First Name
          </Label>
          <Input id="pf-first" placeholder="Sam" className={inputClass} {...register('firstName')} />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div>
          <Label htmlFor="pf-last" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Last Name
          </Label>
          <Input id="pf-last" placeholder="Hoosier" className={inputClass} {...register('lastName')} />
          <FieldError message={errors.lastName?.message} />
        </div>
        <div>
          <Label htmlFor="pf-phone" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Phone
          </Label>
          <Input
            id="pf-phone"
            type="tel"
            placeholder="(317) 555-0142"
            className={inputClass}
            {...register('phone')}
          />
          <FieldError message={errors.phone?.message} />
        </div>
        <div>
          <Label className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Business Type
          </Label>
          <Controller
            control={control}
            name="businessType"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="w-full border-line bg-paper">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {BUSINESS_TYPE_LABEL[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.businessType?.message} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pf-address1" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Street Address
          </Label>
          <Input
            id="pf-address1"
            placeholder="1234 W Main St"
            className={inputClass}
            {...register('address1')}
          />
          <FieldError message={errors.address1?.message} />
        </div>
        <div>
          <Label htmlFor="pf-city" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            City
          </Label>
          <Input id="pf-city" placeholder="Indianapolis" className={inputClass} {...register('city')} />
          <FieldError message={errors.city?.message} />
        </div>
        <div>
          <Label htmlFor="pf-state" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            State
          </Label>
          <Input id="pf-state" placeholder="IN" maxLength={2} className={inputClass} {...register('state')} />
          <FieldError message={errors.state?.message} />
        </div>
        <div>
          <Label htmlFor="pf-zip" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Indiana ZIP
          </Label>
          <Input
            id="pf-zip"
            inputMode="numeric"
            maxLength={5}
            placeholder="46222"
            className={inputClass}
            {...register('zip')}
          />
          <FieldError message={errors.zip?.message} />
        </div>
        <div>
          <Label htmlFor="pf-tax" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Tax ID
          </Label>
          <Input id="pf-tax" placeholder="IN RRMC-000000" className={inputClass} {...register('taxId')} />
          <FieldError message={errors.taxId?.message} />
        </div>
        <div>
          <Label htmlFor="pf-fein" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            FEIN Number
          </Label>
          <Input id="pf-fein" className={inputClass} {...register('feinNumber')} />
          <FieldError message={errors.feinNumber?.message} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pf-tobacco" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Tobacco License Number
          </Label>
          <Input id="pf-tobacco" className={inputClass} {...register('tobaccoId')} />
          <FieldError message={errors.tobaccoId?.message} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button
          type="submit"
          disabled={submitting}
          className="bg-amber text-paper hover:bg-amber-deep"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="text-stone hover:text-ink"
          >
            Cancel
          </Button>
        )}
        <p className="font-mono text-[10px] tracking-[0.14em] text-stone">
          VERIFICATION TYPICALLY COMPLETES WITHIN 1 BUSINESS DAY
        </p>
      </div>
    </form>
  );
}
