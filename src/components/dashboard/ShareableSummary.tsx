import { forwardRef } from 'react';
import { ProcessedStats, formatDuration } from '@/lib/libraryWrappedProcessor';
import { STUDY_SPOTS, StudySpotValue } from './FavouriteStudySpot';
import libsterFullLogo from '@/assets/libster_full_logo.png';
import { Clock, Calendar, Flame, Trophy, MapPin } from 'lucide-react';

interface ShareableSummaryProps {
  stats: ProcessedStats;
  favouriteSpot: StudySpotValue | null;
}

// Helper to format streak dates as "XX Jan - YY Feb"
const formatStreakDates = (startDate: Date, endDate: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startDay = startDate.getUTCDate();
  const startMonth = months[startDate.getUTCMonth()];
  const endDay = endDate.getUTCDate();
  const endMonth = months[endDate.getUTCMonth()];
  return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
};

export const ShareableSummary = forwardRef<HTMLDivElement, ShareableSummaryProps>(
  ({ stats, favouriteSpot }, ref) => {
    const selectedSpotLabel = STUDY_SPOTS.find(s => s.value === favouriteSpot)?.label || 'Not selected';

    return (
      <div
        ref={ref}
        className="w-[360px] h-[640px] bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 text-white relative overflow-hidden"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Content - matches LibraryWrapped summary slide exactly */}
        <div className="flex flex-col h-full w-full px-3 pt-6 pb-16">
          {/* Heading */}
          <h1 className="text-2xl font-black mb-3 text-center">Library Recap 2025</h1>
          
          {/* 2x3 Grid */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            {/* Row 1: Total Time */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="p-1 rounded bg-gradient-to-br from-teal-400 to-cyan-500">
                  <Clock className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium opacity-90">Total Time</span>
              </div>
              <div className="text-xl font-bold">{stats.totalMinutes.toLocaleString()} min</div>
              <div className="text-sm opacity-70 font-normal">≈ {Math.round(stats.totalMinutes / 60).toLocaleString()} hours</div>
            </div>
            
            {/* Row 1: Total Visits */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="p-1 rounded bg-gradient-to-br from-violet-400 to-purple-500">
                  <Calendar className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium opacity-90">Total Visits</span>
              </div>
              <div className="text-xl font-bold">{stats.totalSessions}</div>
              <div className="text-sm opacity-70">library sessions</div>
            </div>
            
            {/* Row 2: Longest Sessions (top 3) */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="p-1 rounded bg-gradient-to-br from-orange-400 to-rose-500">
                  <Trophy className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium opacity-90">Longest Sessions</span>
              </div>
              <div className="space-y-0">
                {stats.topSessions.slice(0, 3).map((session, i) => {
                  const sessionDate = new Date(session.dateISO);
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  const dateStr = `${sessionDate.getUTCDate()} ${months[sessionDate.getUTCMonth()]}`;
                  return (
                    <div key={i} className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-xs opacity-60">{i + 1}.</span>
                      <span className="font-bold text-base">{formatDuration(session.minutes)}</span>
                      <span className="text-[10px] opacity-60 font-normal">({dateStr})</span>
                    </div>
                  );
                })}
                {stats.topSessions.length === 0 && (
                  <div className="text-base opacity-70">No sessions</div>
                )}
              </div>
            </div>
            
            {/* Row 2: Best Streaks (top 3) */}
            <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="p-1 rounded bg-orange-500">
                  <Flame className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs font-medium opacity-90">Best Streaks</span>
              </div>
              <div className="space-y-0">
                {stats.topStreaks.slice(0, 3).map((streak, i) => (
                  <div key={i} className="flex items-baseline gap-1 flex-wrap">
                    <span className="text-xs opacity-60">{i + 1}.</span>
                    <span className="font-bold text-base">{streak.days} days</span>
                    <span className="text-[10px] opacity-60 font-normal">({formatStreakDates(streak.startDate, streak.endDate)})</span>
                  </div>
                ))}
                {stats.topStreaks.length === 0 && (
                  <div className="text-base opacity-70">No streaks</div>
                )}
              </div>
            </div>
            
            {/* Row 3: Favourite Spot (spans full width) */}
            <div className="col-span-2 bg-white/15 backdrop-blur-sm rounded-xl p-1.5 flex items-center justify-center gap-1.5">
              <div className="p-1 rounded bg-gradient-to-br from-emerald-400 to-teal-500">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-medium opacity-90">Favourite Spot</span>
              <span className="font-bold text-xs">{selectedSpotLabel}</span>
            </div>
          </div>
          
          {/* Bottom: Logo left, Libster.co right */}
          <div className="absolute bottom-4 left-3 right-3 flex justify-between items-end">
            <img src={libsterFullLogo} alt="Libster" className="h-4 w-auto opacity-90" />
            <span className="text-[10px] font-semibold opacity-90">Libster.co</span>
          </div>
        </div>
      </div>
    );
  }
);

ShareableSummary.displayName = 'ShareableSummary';