import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/providers/trpc';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LOGIN_PATH } from '@/const';
import { cn } from '@/lib/utils';

type Topic = 'general' | 'sales' | 'salesman';

const TABS: Array<{ value: Topic; label: string; subject: string; helper: string }> = [
  {
    value: 'general',
    label: 'General',
    subject: 'General inquiry',
    helper: 'Questions about products, orders, delivery, or your account — we answer fast.',
  },
  {
    value: 'sales',
    label: 'Sales',
    subject: 'Sales & pricing inquiry',
    helper: 'Volume pricing, product requests, and supplier programs — our sales team will jump on it.',
  },
  {
    value: 'salesman',
    label: 'Request a Salesman',
    subject: 'Request a salesman visit',
    helper: 'Want an MB rep to stop by your store? Tell us where you are and we’ll schedule a visit.',
  },
];

const BUSINESS_TYPES = [
  'Convenience Store',
  'Gas Station',
  'Restaurant',
  'Smoke or Vape Shop',
  'Grocery or Market',
  'Other',
];

const formSchema = z.object({
  name: z.string().min(2, 'Please enter your name'),
  businessName: z.string().min(2, 'Please enter your business name'),
  email: z.email('Enter a valid email address'),
  phone: z.string().min(7, 'Enter a valid phone number').max(40, 'Phone number is too long'),
  businessType: z.string().optional(),
  subject: z.string().min(2, 'Subject is required'),
  message: z
    .string()
    .min(10, 'Give us a little more detail (min 10 characters)')
    .max(500, 'Keep it under 500 characters'),
});

type FormValues = z.infer<typeof formSchema>;

const inputClasses =
  'h-11 rounded-lg border-line bg-paper text-[15px] focus-visible:border-amber focus-visible:ring-amber/30 aria-invalid:border-amber-deep';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[13px] font-medium text-amber-deep">{message}</p>;
}

export default function ContactForm() {
  const [topic, setTopic] = useState<Topic>('general');
  const [refNumber, setRefNumber] = useState<string | null>(null);
  // New keyframe identity per invalid submit so the shake replays without remounting inputs.
  const [shake, setShake] = useState<number[]>([0]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      businessName: '',
      email: '',
      phone: '',
      businessType: '',
      subject: TABS[0].subject,
      message: '',
    },
  });

  const submitMutation = trpc.contact.submit.useMutation({
    onSuccess: (data) => {
      const ref = `MSG-2025-${String(data.id ?? 0).padStart(4, '0')}`;
      setRefNumber(ref);
      toast.success('Message received', {
        description: `Reference ${ref} — we’ll reply within one business day.`,
      });
    },
    onError: () => {
      toast.error('Message could not be sent', {
        description: 'Please try again, or call us at (317) 555-0142.',
      });
    },
  });

  const activeTab = TABS.find((t) => t.value === topic) ?? TABS[0];
  const messageValue = form.watch('message') ?? '';
  const errors = form.formState.errors;

  const onTabChange = (value: string) => {
    const tab = TABS.find((t) => t.value === value);
    if (!tab) return;
    setTopic(tab.value);
    form.setValue('subject', tab.subject, { shouldValidate: false });
  };

  const onSubmit = form.handleSubmit(
    (values) => {
      const message = [
        `Subject: ${values.subject}`,
        `Business: ${values.businessName}`,
        values.businessType ? `Business type: ${values.businessType}` : null,
        '',
        values.message,
      ]
        .filter((l): l is string => l !== null)
        .join('\n');

      submitMutation.mutate({
        name: values.name,
        email: values.email,
        phone: values.phone,
        topic,
        message,
      });
    },
    () => setShake([0, -6, 6, -4, 4, 0]),
  );

  const sendAnother = () => {
    setRefNumber(null);
    form.reset({
      name: '',
      businessName: '',
      email: '',
      phone: '',
      businessType: '',
      subject: activeTab.subject,
      message: '',
    });
  };

  return (
    <div className="rounded-xl border border-line bg-paper p-6 md:p-8">
      <AnimatePresence mode="wait" initial={false}>
        {refNumber ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-forest/40 bg-forest/5 px-6 py-12 text-center"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-forest/10 text-forest">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <h3 className="mt-6 font-display text-2xl font-bold tracking-[-0.02em] text-ink">
              Message received.
            </h3>
            <p className="mt-2 max-w-[420px] text-[15px] leading-[1.6] text-stone">
              We&rsquo;ll reply within one business day. For anything urgent, call us at{' '}
              <a href="tel:(317) 555-0142" className="font-medium text-ink hover:text-amber-deep">
                (317) 555-0142
              </a>
              .
            </p>
            <p className="mt-5 rounded-full border border-line bg-paper px-4 py-1.5 font-mono text-xs font-bold tracking-[0.14em] text-ink">
              REF {refNumber}
            </p>
            <button
              type="button"
              onClick={sendAnother}
              className="mt-8 inline-flex items-center gap-2 rounded-lg border border-ink/20 px-5 py-2.5 text-sm font-semibold text-ink transition-all duration-150 hover:border-ink active:scale-[0.97]"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Tabs value={topic} onValueChange={onTabChange}>
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-lg bg-paper-2 p-1">
                {TABS.map((t) => (
                  <TabsTrigger
                    key={t.value}
                    value={t.value}
                    className="rounded-md px-2 py-2 text-[13px] font-semibold data-[state=active]:bg-paper data-[state=active]:text-ink data-[state=active]:shadow-none md:text-sm"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <div className="mt-3 min-h-[40px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={topic}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="text-[13px] font-medium leading-[1.5] text-stone"
                >
                  {activeTab.helper}
                </motion.p>
              </AnimatePresence>
            </div>

            <form onSubmit={onSubmit} noValidate className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <motion.div animate={errors.name ? { x: shake } : { x: 0 }} transition={{ duration: 0.3 }}>
                  <Label htmlFor="cf-name" className="text-[13px] font-semibold text-ink">
                    Name<span className="text-amber-deep"> *</span>
                  </Label>
                  <Input
                    id="cf-name"
                    autoComplete="name"
                    placeholder="Jane Doe"
                    aria-invalid={!!errors.name}
                    className={cn(inputClasses, 'mt-1.5')}
                    {...form.register('name')}
                  />
                  <FieldError message={errors.name?.message} />
                </motion.div>
                <motion.div
                  animate={errors.businessName ? { x: shake } : { x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Label htmlFor="cf-business" className="text-[13px] font-semibold text-ink">
                    Business name<span className="text-amber-deep"> *</span>
                  </Label>
                  <Input
                    id="cf-business"
                    autoComplete="organization"
                    placeholder="Corner Market LLC"
                    aria-invalid={!!errors.businessName}
                    className={cn(inputClasses, 'mt-1.5')}
                    {...form.register('businessName')}
                  />
                  <FieldError message={errors.businessName?.message} />
                </motion.div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <motion.div animate={errors.email ? { x: shake } : { x: 0 }} transition={{ duration: 0.3 }}>
                  <Label htmlFor="cf-email" className="text-[13px] font-semibold text-ink">
                    Email<span className="text-amber-deep"> *</span>
                  </Label>
                  <Input
                    id="cf-email"
                    type="email"
                    autoComplete="email"
                    placeholder="jane@cornermarket.com"
                    aria-invalid={!!errors.email}
                    className={cn(inputClasses, 'mt-1.5')}
                    {...form.register('email')}
                  />
                  <FieldError message={errors.email?.message} />
                </motion.div>
                <motion.div animate={errors.phone ? { x: shake } : { x: 0 }} transition={{ duration: 0.3 }}>
                  <Label htmlFor="cf-phone" className="text-[13px] font-semibold text-ink">
                    Phone<span className="text-amber-deep"> *</span>
                  </Label>
                  <Input
                    id="cf-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(317) 555-0100"
                    aria-invalid={!!errors.phone}
                    className={cn(inputClasses, 'mt-1.5')}
                    {...form.register('phone')}
                  />
                  <FieldError message={errors.phone?.message} />
                </motion.div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <Label htmlFor="cf-type" className="text-[13px] font-semibold text-ink">
                    Business type
                  </Label>
                  <Controller
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="cf-type"
                          className="mt-1.5 h-11 w-full rounded-lg border-line bg-paper text-[15px] focus:border-amber focus:ring-amber/30"
                        >
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {BUSINESS_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <motion.div
                  animate={errors.subject ? { x: shake } : { x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Label htmlFor="cf-subject" className="text-[13px] font-semibold text-ink">
                    Subject<span className="text-amber-deep"> *</span>
                  </Label>
                  <Input
                    id="cf-subject"
                    aria-invalid={!!errors.subject}
                    className={cn(inputClasses, 'mt-1.5')}
                    {...form.register('subject')}
                  />
                  <FieldError message={errors.subject?.message} />
                </motion.div>
              </div>

              <motion.div animate={errors.message ? { x: shake } : { x: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="cf-message" className="text-[13px] font-semibold text-ink">
                    Message<span className="text-amber-deep"> *</span>
                  </Label>
                  <span className="font-mono text-[11px] tracking-wide text-stone">
                    {messageValue.length}/500
                  </span>
                </div>
                <Textarea
                  id="cf-message"
                  rows={5}
                  maxLength={500}
                  placeholder={
                    topic === 'salesman'
                      ? 'Tell us your store name, address, and the best time for a visit…'
                      : 'How can we help?'
                  }
                  aria-invalid={!!errors.message}
                  className="mt-1.5 rounded-lg border-line bg-paper text-[15px] focus-visible:border-amber focus-visible:ring-amber/30 aria-invalid:border-amber-deep"
                  {...form.register('message')}
                />
                <FieldError message={errors.message?.message} />
              </motion.div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-amber text-sm font-semibold text-paper transition-all duration-150 hover:bg-amber-deep active:scale-[0.98] disabled:opacity-60"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    Send Message
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-[13px] text-stone">
                Opening a new wholesale account?{' '}
                <Link to={LOGIN_PATH} className="font-semibold text-ink underline-offset-4 hover:text-amber-deep hover:underline">
                  Create a free account
                </Link>{' '}
                to unlock wholesale pricing.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
