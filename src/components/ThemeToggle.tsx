import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

/**
 * ThemeToggle — flips between light and dark mode. Matches the existing
 * icon-button styling in Navbar exactly (h-9 w-9, rounded-lg, hover:bg-paper-2)
 * so it sits naturally in the same row as Search/Cart.
 *
 * `mounted` guards against a hydration/flash mismatch: next-themes can't
 * know the real theme until the client mounts, so we render a neutral
 * placeholder icon for that first tick rather than guessing.
 */
export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-ink transition-colors hover:bg-paper-2"
    >
      {mounted && (isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />)}
    </button>
  );
}
