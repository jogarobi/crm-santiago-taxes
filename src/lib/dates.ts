import { format, parseISO, isValid } from 'date-fns';
import { enUS } from 'date-fns/locale';

/**
 * Normalizes any accepted date value into a Date.
 *
 * parseISO is used for strings (never `new Date(string)`) because it treats a
 * date-only value like "1986-12-21" as local midnight instead of UTC midnight.
 * `new Date('1986-12-21')` parses as UTC, so in US time zones it renders as the
 * day before — the classic birthday-off-by-one bug.
 */
const toDate = (v: string | Date | null | undefined): Date | null =>
  !v ? null : v instanceof Date ? v : parseISO(v);

/** "Dec 21, 1986" */
export const fmtDate = (v?: string | Date | null): string => {
  const d = toDate(v);
  return d && isValid(d) ? format(d, 'MMM d, yyyy', { locale: enUS }) : '—';
};

/** "Dec 21, 1986, 3:45 PM" */
export const fmtDateTime = (v?: string | Date | null): string => {
  const d = toDate(v);
  return d && isValid(d)
    ? format(d, 'MMM d, yyyy, h:mm a', { locale: enUS })
    : '—';
};
