import { ProcessedStats, formatDuration } from '@/lib/libraryWrappedProcessor';
import { Clock, Calendar, Flame, Trophy } from 'lucide-react';

interface SummaryCardsProps {
  stats: ProcessedStats;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const hours = Math.floor(stats.totalMinutes / 60);
  const minutes = stats.totalMinutes % 60;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {/* Total Time */}
      <div
        className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in"
        style={{ animationDelay: '0ms' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg gradient-cool">
            <Clock className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-muted-foreground font-medium">Total Time</span>
        </div>
        <div className="stat-number gradient-text">{stats.totalMinutes.toLocaleString()}</div>
        <p className="text-lg text-muted-foreground mt-2">
          minutes ≈ {hours} hours {minutes > 0 && `${minutes} min`}
        </p>
      </div>

      {/* Total Sessions */}
      <div
        className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in"
        style={{ animationDelay: '100ms' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg gradient-accent">
            <Calendar className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-muted-foreground font-medium">Library Visits</span>
        </div>
        <div className="stat-number gradient-text">{stats.totalSessions}</div>
        <p className="text-lg text-muted-foreground mt-2">total sessions</p>
      </div>

      {/* Longest Session */}
      <div
        className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in"
        style={{ animationDelay: '200ms' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg gradient-warm">
            <Trophy className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-muted-foreground font-medium">Longest Session</span>
        </div>
        <div className="stat-number gradient-text">
          {stats.longestSessionMinutes > 0 ? formatDuration(stats.longestSessionMinutes) : '—'}
        </div>
        <p className="text-lg text-muted-foreground mt-2">
          {stats.longestSessionDateISO ? formatDate(stats.longestSessionDateISO) : 'No sessions'}
        </p>
      </div>

      {/* Best Streak */}
      <div
        className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in"
        style={{ animationDelay: '300ms' }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-orange-500">
            <Flame className="w-5 h-5 text-foreground" />
          </div>
          <span className="text-muted-foreground font-medium">Best Streak</span>
        </div>
        <div className="stat-number gradient-text">{stats.longestVisitStreakDays}</div>
        <p className="text-lg text-muted-foreground mt-2">
          {stats.longestVisitStreakDays > 0 ? 'consecutive days' : 'No streaks yet'}
        </p>
      </div>
    </div>
  );
}

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}
