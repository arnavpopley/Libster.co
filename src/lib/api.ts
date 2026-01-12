import { RAW_SWIPES, TERMS } from './realData';
import { processLibraryStats, ProcessedStats, DEFAULT_CONFIG, DEFAULT_TERMS } from './libraryWrappedProcessor';

export interface TimeRange {
  label: string;
  from: Date;
  to: Date;
}

// Configuration for future real API integration
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  useMock: true, // Set to false when real API is available
};

// Process stats once on load
let cachedStats: ProcessedStats | null = null;

export function getProcessedStats(): ProcessedStats {
  if (!cachedStats) {
    cachedStats = processLibraryStats(RAW_SWIPES, DEFAULT_CONFIG, DEFAULT_TERMS);
  }
  return cachedStats;
}

// Helper to parse YYYY-MM-DD as UTC date
function parseTermDateUTC(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function getTimeRanges(): TimeRange[] {
  return [
    // Full year 2025
    {
      label: '2025 (Full)',
      from: new Date(Date.UTC(2025, 0, 1)),
      to: new Date(Date.UTC(2025, 11, 31)),
    },
    // Term-based ranges
    {
      label: TERMS[0].name,
      from: parseTermDateUTC(TERMS[0].start),
      to: parseTermDateUTC(TERMS[0].end),
    },
    {
      label: TERMS[1].name,
      from: parseTermDateUTC(TERMS[1].start),
      to: parseTermDateUTC(TERMS[1].end),
    },
    {
      label: TERMS[2].name,
      from: parseTermDateUTC(TERMS[2].start),
      to: parseTermDateUTC(TERMS[2].end),
    },
  ];
}

// Filter stats by date range (reprocesses with filtered swipes)
export async function fetchLibraryStats(
  from: Date,
  to: Date,
  _accessToken?: string | null
): Promise<ProcessedStats> {
  if (API_CONFIG.useMock) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Filter raw swipes to date range and reprocess
    const filteredSwipes = RAW_SWIPES.filter(swipe => {
      const parts = swipe.date.split('/');
      const swipeDate = new Date(Date.UTC(
        parseInt(parts[2]), 
        parseInt(parts[1]) - 1, 
        parseInt(parts[0])
      ));
      return swipeDate >= from && swipeDate <= to;
    });
    
    return processLibraryStats(filteredSwipes, DEFAULT_CONFIG, DEFAULT_TERMS);
  }
  
  // Real API call (for future integration)
  throw new Error('Real API not implemented');
}