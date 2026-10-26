// Business days for marketplace deadlines: weekdays that aren't US federal holidays.
// Holidays falling on a weekend are observed on the nearest weekday (Saturday → Friday, Sunday → Monday).
// Dates are evaluated in US Eastern time, where RIHOSO operates.

const TZ = "America/New_York";

function nthWeekday(year: number, month: number, weekday: number, n: number) {
  // month 0-11, weekday 0=Sun; n>=1, or -1 for last
  if (n > 0) {
    const first = new Date(Date.UTC(year, month, 1)).getUTCDay();
    return 1 + ((weekday - first + 7) % 7) + (n - 1) * 7;
  }
  const lastDate = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const lastDay = new Date(Date.UTC(year, month, lastDate)).getUTCDay();
  return lastDate - ((lastDay - weekday + 7) % 7);
}

function observed(year: number, month: number, day: number) {
  const d = new Date(Date.UTC(year, month, day));
  const wd = d.getUTCDay();
  if (wd === 6) d.setUTCDate(d.getUTCDate() - 1);
  if (wd === 0) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

const cache = new Map<number, Set<string>>();
export function federalHolidays(year: number) {
  const hit = cache.get(year);
  if (hit) return hit;
  const ymd = (m: number, d: number) => new Date(Date.UTC(year, m, d)).toISOString().slice(0, 10);
  const set = new Set<string>([
    observed(year, 0, 1), // New Year's Day
    ymd(0, nthWeekday(year, 0, 1, 3)), // Martin Luther King Jr. Day
    ymd(1, nthWeekday(year, 1, 1, 3)), // Washington's Birthday
    ymd(4, nthWeekday(year, 4, 1, -1)), // Memorial Day
    observed(year, 5, 19), // Juneteenth
    observed(year, 6, 4), // Independence Day
    ymd(8, nthWeekday(year, 8, 1, 1)), // Labor Day
    ymd(9, nthWeekday(year, 9, 1, 2)), // Columbus Day
    observed(year, 10, 11), // Veterans Day
    ymd(10, nthWeekday(year, 10, 4, 4)), // Thanksgiving
    observed(year, 11, 25), // Christmas
  ]);
  // New Year's Day of next year observed on Dec 31 of this year
  const nextNy = observed(year + 1, 0, 1);
  if (nextNy.startsWith(String(year))) set.add(nextNy);
  cache.set(year, set);
  return set;
}

/** Calendar date (YYYY-MM-DD) of an instant in US Eastern time. */
function easternDate(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function isBusinessDay(d: Date) {
  const ymd = easternDate(d);
  const [y, m, day] = ymd.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return wd !== 0 && wd !== 6 && !federalHolidays(y).has(ymd);
}

/**
 * The deadline `days` business days after `from`: the end of that business day (11:59 pm Eastern,
 * approximated as 04:59 UTC the next day, which is correct to within an hour across daylight saving).
 */
export function addBusinessDays(from: Date, days: number) {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isBusinessDay(d)) added++;
  }
  const ymd = easternDate(d);
  const [y, m, day] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day + 1, 4, 59));
}
