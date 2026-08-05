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
  businessName: z.string().min(1, 'Business name is required').max(255),
  contactName: z.string().min(1, 'Contact name is required').max(255),
  phone: z.string().min(7, 'Enter a valid phone number').max(40),
  businessType: z.enum(['c-store', 'gas-station', 'restaurant', 'smoke-shop', 'market', 'other']),
  street: z.string().min(1, 'Street address is required').max(255),
  city: z.string().min(1, 'City is required').max(100),
  zip: z
    .string()
    .regex(/^4[67]\d{3}$/, 'Indiana delivery only — ZIP must start with 46 or 47'),
  taxId: z.string().min(1, 'Tax / resale ID is required').max(64),
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
      businessName: profile?.businessName ?? '',
      contactName: profile?.contactName ?? '',
      phone: profile?.phone ?? '',
      businessType: profile?.businessType ?? undefined,
      street: profile?.street ?? '',
      city: profile?.city ?? '',
      zip: profile?.zip ?? '',
      taxId: profile?.taxId ?? '',
    },
  });

  // Keep the form in sync if the profile loads/changes after mount.
  useEffect(() => {
    if (!profile) return;
    reset({
      businessName: profile.businessName ?? '',
      contactName: profile.contactName ?? '',
      phone: profile.phone ?? '',
      businessType: profile.businessType ?? undefined,
      street: profile.street ?? '',
      city: profile.city ?? '',
      zip: profile.zip ?? '',
      taxId: profile.taxId ?? '',
    });
  }, [profile, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="pf-business" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Business Name
          </Label>
          <Input
            id="pf-business"
            placeholder="Hoosier Corner Market LLC"
            className={inputClass}
            {...register('businessName')}
          />
          <FieldError message={errors.businessName?.message} />
        </div>
        <div>
          <Label htmlFor="pf-contact" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Contact Name
          </Label>
          <Input
            id="pf-contact"
            placeholder="Sam Hoosier"
            className={inputClass}
            {...register('contactName')}
          />
          <FieldError message={errors.contactName?.message} />
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
          <Label htmlFor="pf-street" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Street Address
          </Label>
          <Input
            id="pf-street"
            placeholder="1234 W Main St"
            className={inputClass}
            {...register('street')}
          />
          <FieldError message={errors.street?.message} />
        </div>
        <div>
          <Label htmlFor="pf-city" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            City
          </Label>
          <Input id="pf-city" placeholder="Indianapolis" className={inputClass} {...register('city')} />
          <FieldError message={errors.city?.message} />
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
        <div className="sm:col-span-2">
          <Label htmlFor="pf-tax" className="font-mono text-[11px] tracking-[0.14em] text-stone uppercase">
            Tax / Resale ID
          </Label>
          <Input
            id="pf-tax"
            placeholder="IN RRMC-000000"
            className={inputClass}
            {...register('taxId')}
          />
          <FieldError message={errors.taxId?.message} />
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
