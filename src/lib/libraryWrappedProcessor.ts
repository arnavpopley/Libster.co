/**
 * Library Recap Processor - Complete 1:1 implementation of the main logic
 * 
 * Key rules:
 * - Sessions are IN->OUT pairs only (orphan filtering)
 * - Merge sessions for "session stats" if return <= MERGE_GAP_MINUTES (gap NOT counted)
 * - Total time is ALWAYS raw time (unmerged)
 * - No-seat sessions are RAW sessions <= NO_SEAT_MAX_MINUTES
 * - Daily totals split sessions across midnights for correct per-day/weekday/month/term totals
 * - Latest departure: prefer sessions that go post-midnight (out_date > in_date)
 */

// ============= TYPES =============
export interface LibraryWrappedConfig {
  NO_SEAT_MAX_MINUTES: number; // <= 15 => "no seat"
  MERGE_GAP_MINUTES: number;   // <= 60 => merges consecutive sessions
  DEBUG?: boolean;
}

export interface TermDef {
  name: string;
  start: Date;
  end: Date;
}

export interface ProcessedTermBreakdown {
  name: string;
  startISO: string;
  endISO: string;
  minutes: number;
  hours: number;
  visitedDays: number;
  totalDays: number;
  consistency: number; // 0..1
  style: string;
}

export interface ProcessedStats {
  // 1) Total time (RAW - unmerged)
  totalMinutes: number;
  totalHours: number;
  analogy: string;

  // 2) Sessions (merged count)
  totalSessions: number;

  // 3) Longest merged session
  longestSessionMinutes: number;
  longestSessionHours: number;
  longestSessionDateISO: string;

  // 4) Average merged session length
  averageSessionMinutes: number;
  averageSessionHours: number;

  // 5) Streaks
  longestVisitStreakDays: number;
  longestAwayStreakDays: number;
  datasetSpanDays: number;

  // 7) Earliest arrival / Latest departure
  earliestArrivalHHMM: string;
  earliestArrivalLabel: string;
  latestDepartureHHMM: string;
  latestDepartureLabel: string;
  latestDeparturePostMidnight: boolean;
  latestDepartureEntryDateISO: string | null;

  // 8) Day-of-week totals (minutes) + "most/least"
  weekdayTotals: Array<{ day: string; minutes: number }>;
  mostDay: string;
  leastDay: string;

  // Day-of-week distribution for charts
  dayOfWeekData: Array<{ day: string; minutes: number; totalVisits: number; averageMinutes: number; sharePercent: number }>;

  // 9) Month-wise totals (YYYY-MM)
  monthTotals: Array<{ month: string; minutes: number }>;

  // 10/11) Term breakdown
  terms: ProcessedTermBreakdown[];
  outsideTermMinutes: number;
  outsideTermHours: number;

  // 12) Visit type breakdown (merged)
  visitTypeBreakdown: {
    quick: number;    // <1h
    standard: number; // 1–3h
    long: number;     // 3–6h
    marathon: number; // >6h
  };

  // 13) No-seat sessions (raw)
  noSeat: {
    maxMinutes: number;
    count: number;
    sharePctOfRawSessions: number;
    totalMinutes: number;
    totalHours: number;
    remainingRawSessionsCount: number;
    remainingRawSessionsTotalMinutes: number;
    remainingRawSessionsTotalHours: number;
  };

  // Orphan swipe filtering info
  orphanFiltering: {
    orphanOutIgnored: number;
    orphanInOverwrittenIgnored: number;
    orphanInAtEndIgnored: number;
    rawSessions: number;
    mergedSessions: number;
  };

  // Top sessions for charts
  topSessions: Array<{
    dateISO: string;      // YYYY-MM-DD
    startHHMM: string;    // HH:MM (raw, no timezone conversion)
    endHHMM: string;      // HH:MM (raw, no timezone conversion)
    minutes: number;
  }>;

  // Top streaks for display
  topStreaks: Array<{
    days: number;
    startDate: Date;
    endDate: Date;
  }>;

  // Best streak
  bestStreak: {
    days: number;
    startDate: Date;
    endDate: Date;
  };

  // Hourly data for peak hours chart
  hourlyData: Array<{
    hour: number;
    totalMinutes: number;
    share: number; // normalised share (0-1)
  }>;

  // Peak study hours (normalised distribution-based)
  peakStudyHours: {
    windowStart: number; // hour (0-23)
    windowEnd: number;   // hour (0-23, wraps around)
    windowShare: number; // share of total time in this window
    displayRange: string; // e.g. "7–10pm"
    persona: string;     // e.g. "night owl", "early morning"
    isBalanced: boolean; // true if top windows are within ~10%
  };

  // Monthly data for chart
  monthlyData: Array<{
    month: string;
    minutes: number;
    sessions: number;
  }>;

  // Debug (optional)
  debug?: {
    totalMinutesRaw: number;
    totalMinutesMerged: number;
    totalMinutesDailySplit: number;
    totalMinutesWeekdaySum: number;
    totalMinutesMonthSum: number;
    totalMinutesTermSum: number;
  };
}

// ============= DEFAULTS =============
export const DEFAULT_CONFIG: LibraryWrappedConfig = {
  NO_SEAT_MAX_MINUTES: 15.0,
  MERGE_GAP_MINUTES: 60.0,
  DEBUG: false,
};

// Imperial term dates (inclusive)
export const DEFAULT_TERMS: TermDef[] = [
  { name: "Spring Term 2025", start: dateUTC(2025, 1, 4), end: dateUTC(2025, 3, 21) },
  { name: "Summer Term 2025", start: dateUTC(2025, 4, 26), end: dateUTC(2025, 6, 27) },
  { name: "Autumn Term 2025", start: dateUTC(2025, 9, 27), end: dateUTC(2025, 12, 12) },
];

export const OUTSIDE_LABEL = "Outside term time";

// ============= INTERNAL TYPES =============
interface RawSwipe {
  date: string;
  time: string;
  direction: 'In' | 'Out';
}

interface Swipe {
  timestampMs: number;
  direction: 'IN' | 'OUT';
}

interface Session {
  inMs: number;
  outMs: number;
  durationSeconds: number;
  durationMinutes: number;
}

// ============= HELPER FUNCTIONS =============
function dateUTC(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function sum(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0);
}

function parseDDMMYYYY(s: string): Date | null {
  if (!s) return null;
  const str = String(s).trim();
  const parts = str.split(/[\/\-.]/).map(x => x.trim());
  if (parts.length < 3) return null;
  const dd = Number(parts[0]);
  const mm = Number(parts[1]);
  const yyyy = Number(parts[2]);
  if (!Number.isFinite(dd) || !Number.isFinite(mm) || !Number.isFinite(yyyy)) return null;
  if (yyyy < 1900 || mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return new Date(Date.UTC(yyyy, mm - 1, dd, 0, 0, 0, 0));
}

function parseTimeToMinutes(val: string): number | null {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  const minutes = hh * 60 + mm;
  return Math.min(24 * 60 - 1, Math.max(0, minutes));
}

function buildTimestampUTC(dateStr: string, timeStr: string): number | null {
  const d = parseDDMMYYYY(dateStr);
  if (!d) return null;
  const minutes = parseTimeToMinutes(timeStr);
  if (minutes == null) return null;
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const hh = Math.floor(minutes / 60);
  const mm = minutes % 60;
  return Date.UTC(y, m, day, hh, mm, 0, 0);
}

function dateKeyUTCFromMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y.toString().padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateKeyUTCFromDate(d: Date): string {
  return `${d.getUTCFullYear().toString().padStart(4, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function parseDateKeyUTC(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function nextMidnightUTC(ms: number): number {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  return Date.UTC(y, m, day + 1, 0, 0, 0, 0);
}

function* splitSessionByDayUTC(inMs: number, outMs: number): Generator<{ dateKey: string; minutes: number }> {
  let cur = inMs;
  while (dateKeyUTCFromMs(cur) < dateKeyUTCFromMs(outMs)) {
    const nextMid = nextMidnightUTC(cur);
    const mins = (nextMid - cur) / 1000.0 / 60.0;
    yield { dateKey: dateKeyUTCFromMs(cur), minutes: mins };
    cur = nextMid;
  }
  yield { dateKey: dateKeyUTCFromMs(cur), minutes: (outMs - cur) / 1000.0 / 60.0 };
}

function minutesSinceMidnightUTC(ms: number): number {
  const d = new Date(ms);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function minutesToHHMM(m: number): string {
  const hh = Math.floor(m / 60);
  const mm = Math.round(m % 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function timeOfDayLabel(mins: number, kind: 'arrival' | 'departure'): string {
  if (kind === 'arrival') {
    if (mins <= 8 * 60) return 'early bird';
    if (mins >= 11 * 60) return 'late starter';
    return 'regular';
  } else {
    if (mins >= 23 * 60) return 'night owl';
    if (mins <= 18 * 60) return 'early finisher';
    return 'regular';
  }
}

function analogy(mins: number): string {
  const hours = mins / 60.0;
  return `~${(hours / 8.0).toFixed(2)}× 8-hour days, or ~${(hours / 40.0).toFixed(2)}× 40-hour work weeks`;
}

function daysBetweenUTC(a: Date, b: Date): number {
  const msA = Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate());
  const msB = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.round((msB - msA) / (24 * 3600 * 1000));
}

function addDaysUTC(d: Date, n: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n, 0, 0, 0, 0));
}

function dayNameUTC(d: Date): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[d.getUTCDay()];
}

function studyStyle(totalHours: number, consistency: number): string {
  if (totalHours >= 60 && consistency < 0.35) return 'crammer (high hours, low consistency)';
  if (25 <= totalHours && totalHours < 60 && consistency >= 0.45) return 'steady grinder (medium hours, high consistency)';
  if (totalHours >= 60 && consistency >= 0.45) return 'machine (high hours, high consistency)';
  if (totalHours < 25 && consistency < 0.35) return 'dabbler (low hours, low consistency)';
  return 'mixed';
}

// ============= PAIRING & MERGING =============
function buildSwipesFromData(rawSwipes: RawSwipe[]): Swipe[] {
  const out: Swipe[] = [];
  for (const swipe of rawSwipes) {
    const dir = String(swipe.direction).trim().toUpperCase();
    if (dir !== 'IN' && dir !== 'OUT') continue;
    const ts = buildTimestampUTC(swipe.date, swipe.time);
    if (ts == null) continue;
    out.push({ timestampMs: ts, direction: dir as 'IN' | 'OUT' });
  }
  return out.sort((a, b) => a.timestampMs - b.timestampMs);
}

function pairRawSessions(swipes: Swipe[]): {
  sessionsRaw: Session[];
  orphan_in_overwritten: number;
  orphan_out_no_in: number;
  orphan_in_at_end: number;
} {
  const sessionsRaw: Session[] = [];
  let lastIn: number | null = null;
  let orphan_in_overwritten = 0;
  let orphan_out_no_in = 0;
  let orphan_in_at_end = 0;

  for (const s of swipes) {
    if (s.direction === 'IN') {
      if (lastIn == null) {
        lastIn = s.timestampMs;
      } else {
        orphan_in_overwritten += 1;
        lastIn = s.timestampMs;
      }
    } else {
      // OUT
      if (lastIn == null) {
        orphan_out_no_in += 1;
      } else {
        if (s.timestampMs >= lastIn) {
          const durS = (s.timestampMs - lastIn) / 1000.0;
          sessionsRaw.push({
            inMs: lastIn,
            outMs: s.timestampMs,
            durationSeconds: durS,
            durationMinutes: durS / 60.0,
          });
        }
        lastIn = null;
      }
    }
  }
  if (lastIn != null) orphan_in_at_end += 1;

  return { sessionsRaw, orphan_in_overwritten, orphan_out_no_in, orphan_in_at_end };
}

function mergeSessionsByGap(sessionsRaw: Session[], gapMinutes: number): Session[] {
  if (sessionsRaw.length === 0) return [];
  const s = [...sessionsRaw].sort((a, b) => a.inMs - b.inMs);
  const merged: Session[] = [];
  
  let curIn = s[0].inMs;
  let curOut = s[0].outMs;
  let curDurS = s[0].durationSeconds;

  for (let i = 1; i < s.length; i++) {
    const next = s[i];
    const gap = (next.inMs - curOut) / 1000.0 / 60.0;
    if (gap >= 0 && gap <= gapMinutes) {
      curOut = next.outMs;
      curDurS += next.durationSeconds; // gap NOT added
    } else {
      merged.push({
        inMs: curIn,
        outMs: curOut,
        durationSeconds: curDurS,
        durationMinutes: curDurS / 60.0,
      });
      curIn = next.inMs;
      curOut = next.outMs;
      curDurS = next.durationSeconds;
    }
  }
  merged.push({
    inMs: curIn,
    outMs: curOut,
    durationSeconds: curDurS,
    durationMinutes: curDurS / 60.0,
  });

  return merged;
}

// ============= STATS COMPUTATION =============
function computeWeekdayTotals(minutesByDay: Map<string, number>): Array<{ day: string; minutes: number }> {
  const order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const totals = new Map<string, number>(order.map(d => [d, 0]));
  
  for (const [dateKey, mins] of minutesByDay.entries()) {
    const dt = parseDateKeyUTC(dateKey);
    const dayName = dayNameUTC(dt);
    totals.set(dayName, (totals.get(dayName) ?? 0) + mins);
  }
  
  return order.map(day => ({ day, minutes: Math.round(totals.get(day) ?? 0) }));
}

function computeDayOfWeekAvgPerVisitDay(minutesByDay: Map<string, number>): Array<{ day: string; minutes: number; totalVisits: number; averageMinutes: number; sharePercent: number }> {
  const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  const dowMinutes = new Map<string, number>(dowNames.map(d => [d, 0]));
  const dowVisitDays = new Map<string, number>(dowNames.map(d => [d, 0]));

  for (const [dateKey, mins] of minutesByDay.entries()) {
    const dt = parseDateKeyUTC(dateKey);
    const name = dowNames[dt.getUTCDay()];
    dowMinutes.set(name, (dowMinutes.get(name) ?? 0) + mins);
    dowVisitDays.set(name, (dowVisitDays.get(name) ?? 0) + 1);
  }

  const ordered = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Calculate total minutes across all days for normalisation
  const totalWeekMinutes = ordered.reduce((sum, day) => sum + (dowMinutes.get(day) ?? 0), 0);
  
  return ordered.map(day => {
    const total = dowMinutes.get(day) ?? 0;
    const visits = dowVisitDays.get(day) ?? 0;
    const avg = visits > 0 ? total / visits : 0;
    const sharePercent = totalWeekMinutes > 0 ? (total / totalWeekMinutes) * 100 : 0;
    return { day, minutes: Math.round(total), totalVisits: visits, averageMinutes: Math.round(avg), sharePercent: Math.round(sharePercent * 10) / 10 };
  });
}

function computeMonthTotals(minutesByDay: Map<string, number>): Array<{ month: string; minutes: number }> {
  const monthMap = new Map<string, number>();
  for (const [dateKey, mins] of minutesByDay.entries()) {
    const month = dateKey.slice(0, 7); // YYYY-MM
    monthMap.set(month, (monthMap.get(month) ?? 0) + mins);
  }
  return [...monthMap.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([month, minutes]) => ({ month, minutes: Math.round(minutes) }));
}

function computeTermBreakdown(
  minutesByDay: Map<string, number>,
  visitedSet: Set<string>,
  terms: TermDef[]
): { termsOut: ProcessedTermBreakdown[]; outsideMinutes: number } {
  const termMinutes = new Map<string, number>();
  const termVisitDays = new Map<string, number>();
  const termTotalDays = new Map<string, number>();

  for (const t of terms) {
    termMinutes.set(t.name, 0);
    termVisitDays.set(t.name, 0);
    termTotalDays.set(t.name, daysBetweenUTC(t.start, t.end) + 1);
  }

  for (const [dateKey, mins] of minutesByDay.entries()) {
    const d = parseDateKeyUTC(dateKey);
    const label = termLabelUTC(d, terms);
    if (label !== OUTSIDE_LABEL) {
      termMinutes.set(label, (termMinutes.get(label) ?? 0) + mins);
    }
  }

  for (const t of terms) {
    let v = 0;
    let iter = new Date(t.start.getTime());
    while (iter.getTime() <= t.end.getTime()) {
      const key = dateKeyUTCFromDate(iter);
      if (visitedSet.has(key)) v += 1;
      iter = addDaysUTC(iter, 1);
    }
    termVisitDays.set(t.name, v);
  }

  let outsideMinutes = 0;
  for (const [dateKey, mins] of minutesByDay.entries()) {
    const d = parseDateKeyUTC(dateKey);
    if (termLabelUTC(d, terms) === OUTSIDE_LABEL) outsideMinutes += mins;
  }

  const termsOut: ProcessedTermBreakdown[] = terms.map(t => {
    const minutes = termMinutes.get(t.name) ?? 0;
    const totalDays = termTotalDays.get(t.name) ?? 0;
    const visitedDays = termVisitDays.get(t.name) ?? 0;
    const consistency = totalDays ? visitedDays / totalDays : 0;
    const style = studyStyle(minutes / 60.0, consistency);
    return {
      name: t.name,
      startISO: dateKeyUTCFromDate(t.start),
      endISO: dateKeyUTCFromDate(t.end),
      minutes: Math.round(minutes),
      hours: minutes / 60.0,
      visitedDays,
      totalDays,
      consistency,
      style,
    };
  });

  return { termsOut, outsideMinutes: Math.round(outsideMinutes) };
}

function termLabelUTC(d: Date, terms: TermDef[]): string {
  for (const t of terms) {
    if (d.getTime() >= t.start.getTime() && d.getTime() <= t.end.getTime()) return t.name;
  }
  return OUTSIDE_LABEL;
}

function streaksFromVisitedDatesUTC(visitedDatesSorted: Date[]): { 
  longestVisitStreak: number; 
  longestAwayStreak: number; 
  spanDays: number;
  allStreaks: Array<{ days: number; startDate: Date; endDate: Date }>;
} {
  if (visitedDatesSorted.length === 0) {
    return { longestVisitStreak: 0, longestAwayStreak: 0, spanDays: 0, allStreaks: [] };
  }

  const minD = visitedDatesSorted[0];
  const maxD = visitedDatesSorted[visitedDatesSorted.length - 1];
  const spanDays = daysBetweenUTC(minD, maxD) + 1;

  // Collect all streaks
  const allStreaks: Array<{ days: number; startDate: Date; endDate: Date }> = [];
  let cur = 1;
  let curStart = visitedDatesSorted[0];
  let prev: Date | null = null;

  for (const d of visitedDatesSorted) {
    if (prev == null) {
      prev = d;
      continue;
    }
    if (daysBetweenUTC(prev, d) === 1) {
      cur += 1;
    } else {
      if (cur >= 2) {
        allStreaks.push({ days: cur, startDate: curStart, endDate: prev });
      }
      cur = 1;
      curStart = d;
    }
    prev = d;
  }
  if (cur >= 2 && prev) {
    allStreaks.push({ days: cur, startDate: curStart, endDate: prev });
  }

  const longestVisitStreak = allStreaks.length > 0 ? Math.max(...allStreaks.map(s => s.days)) : (visitedDatesSorted.length > 0 ? 1 : 0);

  // Longest away streak
  const visitedKeys = new Set(visitedDatesSorted.map(d => dateKeyUTCFromDate(d)));
  let longestAwayStreak = 0;
  let curAway = 0;
  let iter = new Date(minD.getTime());
  while (iter.getTime() <= maxD.getTime()) {
    const k = dateKeyUTCFromDate(iter);
    if (visitedKeys.has(k)) {
      longestAwayStreak = Math.max(longestAwayStreak, curAway);
      curAway = 0;
    } else {
      curAway += 1;
    }
    iter = addDaysUTC(iter, 1);
  }
  longestAwayStreak = Math.max(longestAwayStreak, curAway);

  return { longestVisitStreak, longestAwayStreak, spanDays, allStreaks };
}

function pickLatestDepartureMerged(sessionsMerged: Session[]): { inMs: number; outTodMin: number; postMidnight: boolean } {
  let best = {
    inMs: sessionsMerged[0].inMs,
    outTodMin: minutesSinceMidnightUTC(sessionsMerged[0].outMs),
    postMidnight: dateKeyUTCFromMs(sessionsMerged[0].outMs) > dateKeyUTCFromMs(sessionsMerged[0].inMs),
  };

  for (const s of sessionsMerged) {
    const postMidnight = dateKeyUTCFromMs(s.outMs) > dateKeyUTCFromMs(s.inMs);
    const outTodMin = minutesSinceMidnightUTC(s.outMs);
    const a0 = best.postMidnight ? 1 : 0;
    const b0 = postMidnight ? 1 : 0;
    if (b0 > a0) {
      best = { inMs: s.inMs, outTodMin, postMidnight };
    } else if (b0 === a0 && outTodMin > best.outTodMin) {
      best = { inMs: s.inMs, outTodMin, postMidnight };
    }
  }
  return best;
}

// ============= MAIN PROCESS FUNCTION =============
export function processLibraryStats(
  rawSwipes: RawSwipe[],
  config: LibraryWrappedConfig = DEFAULT_CONFIG,
  terms: TermDef[] = DEFAULT_TERMS
): ProcessedStats {
  // Build and sort swipes
  const swipes = buildSwipesFromData(rawSwipes);

  // Pair sessions with orphan filtering
  const { sessionsRaw, orphan_in_overwritten, orphan_out_no_in, orphan_in_at_end } = pairRawSessions(swipes);

  if (sessionsRaw.length === 0) {
    return getEmptyStats();
  }

  // Merge sessions for session stats only
  const sessionsMerged = mergeSessionsByGap(sessionsRaw, config.MERGE_GAP_MINUTES);

  // Invariant: merged total minutes equals raw total minutes
  const rawTotalMin = sum(sessionsRaw.map(s => s.durationMinutes));
  const mergedTotalMin = sum(sessionsMerged.map(s => s.durationMinutes));

  // No-seat sessions (RAW)
  const noSeatSessions = sessionsRaw.filter(s => s.durationMinutes <= config.NO_SEAT_MAX_MINUTES);
  const noSeatCount = noSeatSessions.length;
  const noSeatTotalMinutes = sum(noSeatSessions.map(s => s.durationMinutes));
  const noSeatPct = (noSeatCount / sessionsRaw.length) * 100.0;
  const seatedSessions = sessionsRaw.filter(s => s.durationMinutes > config.NO_SEAT_MAX_MINUTES);
  const seatedCount = seatedSessions.length;
  const seatedTotalMinutes = sum(seatedSessions.map(s => s.durationMinutes));

  // Daily split (RAW sessions) => accurate per-day totals
  const minutesByDay = new Map<string, number>();
  for (const s of sessionsRaw) {
    for (const part of splitSessionByDayUTC(s.inMs, s.outMs)) {
      minutesByDay.set(part.dateKey, (minutesByDay.get(part.dateKey) ?? 0) + part.minutes);
    }
  }

  // Visited dates
  const visitedDateKeys = [...minutesByDay.entries()]
    .filter(([, mins]) => mins > 0)
    .map(([k]) => k)
    .sort();
  const visitedDates = visitedDateKeys.map(k => parseDateKeyUTC(k));
  const visitedSet = new Set(visitedDateKeys);

  // =========================
  // METRICS
  // =========================

  // Total time uses RAW
  const totalMinutes = rawTotalMin;
  const totalHours = totalMinutes / 60.0;

  // Sessions count uses MERGED
  const totalSessions = sessionsMerged.length;

  // Longest merged session
  let longest = sessionsMerged[0];
  for (const s of sessionsMerged) {
    if (s.durationMinutes > longest.durationMinutes) longest = s;
  }
  const longestMinutes = longest.durationMinutes;
  const longestDateISO = dateKeyUTCFromMs(longest.inMs);

  // Average merged session
  const avgMinutes = mergedTotalMin / sessionsMerged.length;

  // Streaks
  const { longestVisitStreak, longestAwayStreak, spanDays, allStreaks } = streaksFromVisitedDatesUTC(visitedDates);
  const topStreaks = allStreaks.sort((a, b) => b.days - a.days).slice(0, 3);
  const bestStreak = topStreaks[0] || { days: longestVisitStreak, startDate: new Date(), endDate: new Date() };

  // Earliest arrival (from RAW sessions)
  const earliestArrivalMin = Math.min(...sessionsRaw.map(s => minutesSinceMidnightUTC(s.inMs)));
  const earliestArrivalHHMM = minutesToHHMM(earliestArrivalMin);
  const arrivalLabel = timeOfDayLabel(earliestArrivalMin, 'arrival');

  // Latest departure (MERGED sessions)
  const bestLatest = pickLatestDepartureMerged(sessionsMerged);
  const latestDepartureMin = bestLatest.outTodMin;
  const latestDepartureHHMM = minutesToHHMM(latestDepartureMin);
  const latestDeparturePostMidnight = bestLatest.postMidnight;
  const latestDepartureEntryDateISO = bestLatest.postMidnight ? dateKeyUTCFromMs(bestLatest.inMs) : null;
  const departureLabel = timeOfDayLabel(latestDepartureMin, 'departure');

  // Day-of-week totals (from daily totals)
  const weekdayTotals = computeWeekdayTotals(minutesByDay);
  const mostDay = weekdayTotals.reduce((a, b) => (b.minutes > a.minutes ? b : a)).day;
  const leastDay = weekdayTotals.reduce((a, b) => (b.minutes < a.minutes ? b : a)).day;

  // Avg per visit-day for charts
  const dayOfWeekData = computeDayOfWeekAvgPerVisitDay(minutesByDay);

  // Month totals
  const monthTotals = computeMonthTotals(minutesByDay);

  // Term breakdown
  const { termsOut, outsideMinutes } = computeTermBreakdown(minutesByDay, visitedSet, terms);

  // Visit type breakdown (MERGED)
  const quick = sessionsMerged.filter(s => s.durationMinutes < 60).length;
  const standard = sessionsMerged.filter(s => s.durationMinutes >= 60 && s.durationMinutes < 180).length;
  const long_ = sessionsMerged.filter(s => s.durationMinutes >= 180 && s.durationMinutes < 360).length;
  const marathon = sessionsMerged.filter(s => s.durationMinutes >= 360).length;

  // Top 5 sessions (MERGED) - use UTC time strings to avoid timezone conversion
  const topSessions = [...sessionsMerged]
    .sort((a, b) => b.durationMinutes - a.durationMinutes)
    .slice(0, 5)
    .map(s => ({
      dateISO: dateKeyUTCFromMs(s.inMs),
      startHHMM: minutesToHHMM(minutesSinceMidnightUTC(s.inMs)),
      endHHMM: minutesToHHMM(minutesSinceMidnightUTC(s.outMs)),
      minutes: Math.round(s.durationMinutes),
    }));

  // Hourly data (from RAW sessions - distribute minutes across all hours spanned)
  // Uses normalised distribution for peak study hours
  const hourlyMinutes = new Array(24).fill(0);
  for (const s of sessionsRaw) {
    // Distribute session minutes across each hour it spans
    let currentMs = s.inMs;
    const endMs = s.outMs;
    
    while (currentMs < endMs) {
      const currentHour = new Date(currentMs).getUTCHours();
      // Calculate end of current hour
      const currentDate = new Date(currentMs);
      const nextHourMs = Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate(),
        currentHour + 1,
        0, 0, 0
      );
      
      // Minutes in this hour: from current position to either end of hour or end of session
      const segmentEndMs = Math.min(nextHourMs, endMs);
      const minutesInHour = (segmentEndMs - currentMs) / 1000 / 60;
      
      hourlyMinutes[currentHour] += minutesInHour;
      currentMs = segmentEndMs;
    }
  }
  
  const totalMinutesForHourly = sum(hourlyMinutes);
  
  // Normalise to shares (sum to 1)
  const hourlyShares = hourlyMinutes.map(m => 
    totalMinutesForHourly > 0 ? m / totalMinutesForHourly : 0
  );
  
  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    totalMinutes: Math.round(hourlyMinutes[hour]),
    share: hourlyShares[hour],
  }));
  
  // Compute 3-hour rolling window shares (wraps at midnight)
  const windowShares = Array.from({ length: 24 }, (_, h) => {
    return hourlyShares[h] + hourlyShares[(h + 1) % 24] + hourlyShares[(h + 2) % 24];
  });
  
  // Find top two windows
  const sortedWindows = windowShares
    .map((share, hour) => ({ hour, share }))
    .sort((a, b) => b.share - a.share);
  
  const topWindow = sortedWindows[0];
  const secondWindow = sortedWindows[1];
  
  // Stability rule: if top window is within ~10% of second, user is "balanced"
  const isBalanced = secondWindow && topWindow.share > 0 
    ? (topWindow.share - secondWindow.share) / topWindow.share < 0.1
    : false;
  
  // Format hour range for display
  const formatHourRange = (startHour: number): string => {
    const endHour = (startHour + 3) % 24;
    const formatHour = (h: number): string => {
      if (h === 0) return '12am';
      if (h === 12) return '12pm';
      return h < 12 ? `${h}am` : `${h - 12}pm`;
    };
    return `${formatHour(startHour)}–${formatHour(endHour)}`;
  };
  
  // Derive persona from midpoint of peak window
  const getMidpointPersona = (startHour: number): string => {
    const midpoint = (startHour + 1.5) % 24; // midpoint of 3-hour window
    if (midpoint >= 5 && midpoint < 10) return 'early bird';
    if (midpoint >= 10 && midpoint < 14) return 'daytime studier';
    if (midpoint >= 14 && midpoint < 18) return 'afternoon grinder';
    if (midpoint >= 18 && midpoint < 21) return 'evening warrior';
    // 21-02 (wraps around midnight)
    return 'night owl';
  };
  
  const peakStudyHours = {
    windowStart: topWindow.hour,
    windowEnd: (topWindow.hour + 3) % 24,
    windowShare: topWindow.share,
    displayRange: formatHourRange(topWindow.hour),
    persona: isBalanced ? 'balanced' : getMidpointPersona(topWindow.hour),
    isBalanced,
  };

  // Monthly data for chart (with session count)
  const monthSessionCount = new Map<string, number>();
  for (const s of sessionsMerged) {
    const monthKey = dateKeyUTCFromMs(s.inMs).slice(0, 7);
    monthSessionCount.set(monthKey, (monthSessionCount.get(monthKey) ?? 0) + 1);
  }
  const monthlyData = monthTotals.map(m => ({
    month: formatMonthLabel(m.month),
    minutes: m.minutes,
    sessions: monthSessionCount.get(m.month) ?? 0,
  }));

  // Debug invariants
  let debug: ProcessedStats['debug'] | undefined;
  if (config.DEBUG) {
    const dailySum = sum([...minutesByDay.values()]);
    const weekdaySum = sum(weekdayTotals.map(w => w.minutes));
    const monthSum = sum(monthTotals.map(m => m.minutes));
    const termSum = sum(termsOut.map(t => t.minutes)) + outsideMinutes;
    debug = {
      totalMinutesRaw: rawTotalMin,
      totalMinutesMerged: mergedTotalMin,
      totalMinutesDailySplit: dailySum,
      totalMinutesWeekdaySum: weekdaySum,
      totalMinutesMonthSum: monthSum,
      totalMinutesTermSum: termSum,
    };
  }

  return {
    totalMinutes: Math.round(totalMinutes),
    totalHours,
    analogy: analogy(totalMinutes),
    totalSessions,
    longestSessionMinutes: Math.round(longestMinutes),
    longestSessionHours: longestMinutes / 60.0,
    longestSessionDateISO: longestDateISO,
    averageSessionMinutes: Math.round(avgMinutes),
    averageSessionHours: avgMinutes / 60.0,
    longestVisitStreakDays: longestVisitStreak,
    longestAwayStreakDays: longestAwayStreak,
    datasetSpanDays: spanDays,
    earliestArrivalHHMM,
    earliestArrivalLabel: arrivalLabel,
    latestDepartureHHMM,
    latestDepartureLabel: departureLabel,
    latestDeparturePostMidnight,
    latestDepartureEntryDateISO,
    weekdayTotals,
    mostDay,
    leastDay,
    dayOfWeekData,
    monthTotals,
    terms: termsOut,
    outsideTermMinutes: outsideMinutes,
    outsideTermHours: outsideMinutes / 60.0,
    visitTypeBreakdown: { quick, standard, long: long_, marathon },
    noSeat: {
      maxMinutes: config.NO_SEAT_MAX_MINUTES,
      count: noSeatCount,
      sharePctOfRawSessions: noSeatPct,
      totalMinutes: Math.round(noSeatTotalMinutes),
      totalHours: noSeatTotalMinutes / 60.0,
      remainingRawSessionsCount: seatedCount,
      remainingRawSessionsTotalMinutes: Math.round(seatedTotalMinutes),
      remainingRawSessionsTotalHours: seatedTotalMinutes / 60.0,
    },
    orphanFiltering: {
      orphanOutIgnored: orphan_out_no_in,
      orphanInOverwrittenIgnored: orphan_in_overwritten,
      orphanInAtEndIgnored: orphan_in_at_end,
      rawSessions: sessionsRaw.length,
      mergedSessions: sessionsMerged.length,
    },
    topSessions,
    topStreaks,
    bestStreak,
    hourlyData,
    peakStudyHours,
    monthlyData,
    ...(debug ? { debug } : {}),
  };
}

function formatMonthLabel(yyyymm: string): string {
  const [year, month] = yyyymm.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[parseInt(month) - 1]} ${year}`;
}

function getEmptyStats(): ProcessedStats {
  return {
    totalMinutes: 0,
    totalHours: 0,
    analogy: '',
    totalSessions: 0,
    longestSessionMinutes: 0,
    longestSessionHours: 0,
    longestSessionDateISO: '',
    averageSessionMinutes: 0,
    averageSessionHours: 0,
    longestVisitStreakDays: 0,
    longestAwayStreakDays: 0,
    datasetSpanDays: 0,
    earliestArrivalHHMM: '',
    earliestArrivalLabel: '',
    latestDepartureHHMM: '',
    latestDepartureLabel: '',
    latestDeparturePostMidnight: false,
    latestDepartureEntryDateISO: null,
    weekdayTotals: [],
    mostDay: '',
    leastDay: '',
    dayOfWeekData: [],
    monthTotals: [],
    terms: [],
    outsideTermMinutes: 0,
    outsideTermHours: 0,
    visitTypeBreakdown: { quick: 0, standard: 0, long: 0, marathon: 0 },
    noSeat: {
      maxMinutes: 15,
      count: 0,
      sharePctOfRawSessions: 0,
      totalMinutes: 0,
      totalHours: 0,
      remainingRawSessionsCount: 0,
      remainingRawSessionsTotalMinutes: 0,
      remainingRawSessionsTotalHours: 0,
    },
    orphanFiltering: {
      orphanOutIgnored: 0,
      orphanInOverwrittenIgnored: 0,
      orphanInAtEndIgnored: 0,
      rawSessions: 0,
      mergedSessions: 0,
    },
    topSessions: [],
    topStreaks: [],
    bestStreak: { days: 0, startDate: new Date(), endDate: new Date() },
    hourlyData: [],
    peakStudyHours: {
      windowStart: 0,
      windowEnd: 3,
      windowShare: 0,
      displayRange: '',
      persona: '',
      isBalanced: false,
    },
    monthlyData: [],
  };
}

// Export helper for formatting
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
}

export function formatMinutes(minutes: number): { hours: number; mins: number; display: string } {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) {
    return { hours: 0, mins, display: `${mins}m` };
  }
  return { hours, mins, display: `${hours}h ${mins}m` };
}