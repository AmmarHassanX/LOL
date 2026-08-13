import { useEffect, useState } from 'react';

/**
 * Operating hours — single source of truth for About + Contact pages.
 * Mon–Sat 9:30 AM–8:00 PM · Sun 10:30 AM–6:00 PM (America/Indiana/Indianapolis).
 * Verified against mbwholesalellc.com's own listed store hours.
 */
export const HOURS_ROWS: Array<[string, string]> = [
  ['MON – SAT', '9:30 AM – 8:00 PM'],
  ['SUNDAY', '10:30 AM – 6:00 PM'],
];

export const WILL_CALL_ROW: [string, string] = ['WILL-CALL / CASH & CARRY', 'MON–SAT DURING HOURS'];

const TZ = 'America/Indiana/Indianapolis';
const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;

/** Minutes-from-midnight [open, close) windows indexed by JS weekday (0 = Sunday). */
const WINDOWS: Array<[number, number] | null> = [
  [10 * 60 + 30, 18 * 60], // Sunday 10:30 AM – 6:00 PM
  [9 * 60 + 30, 20 * 60], // Monday 9:30 AM – 8:00 PM
  [9 * 60 + 30, 20 * 60],
  [9 * 60 + 30, 20 * 60],
  [9 * 60 + 30, 20 * 60],
  [9 * 60 + 30, 20 * 60],
  [9 * 60 + 30, 20 * 60], // Saturday
];

export interface OpenStatus {
  open: boolean;
  /** e.g. "Closes 6:00 PM" or "Opens Mon 8:00 AM" */
  note: string;
}

function fmt(minutes: number): string {
  const h24 = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/** Current weekday + minutes-since-midnight in Indianapolis time. */
function indyParts(now: Date): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  let day = 0;
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === 'weekday') day = WEEKDAY_INDEX[p.value] ?? 0;
    else if (p.type === 'hour') hour = Number(p.value) % 24;
    else if (p.type === 'minute') minute = Number(p.value);
  }
  return { day, minutes: hour * 60 + minute };
}

export function getOpenStatus(now: Date = new Date()): OpenStatus {
  const { day, minutes } = indyParts(now);
  const win = WINDOWS[day];
  if (win && minutes >= win[0] && minutes < win[1]) {
    return { open: true, note: `Closes ${fmt(win[1])}` };
  }
  for (let i = 0; i < 8; i++) {
    const d = (day + i) % 7;
    const w = WINDOWS[d];
    if (!w) continue;
    if (i === 0 && minutes >= w[0]) continue; // past today's window
    return { open: false, note: `Opens ${i === 0 ? 'today' : DAY_NAMES[d]} ${fmt(w[0])}` };
  }
  return { open: false, note: '' };
}

/** Live open/closed status, refreshed on an interval. */
export function useOpenStatus(refreshMs = 30_000): OpenStatus {
  const [status, setStatus] = useState<OpenStatus>(() => getOpenStatus());
  useEffect(() => {
    const id = window.setInterval(() => setStatus(getOpenStatus()), refreshMs);
    return () => window.clearInterval(id);
  }, [refreshMs]);
  return status;
}
