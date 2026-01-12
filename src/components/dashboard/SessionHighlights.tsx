import { ProcessedStats, formatDuration } from '@/lib/libraryWrappedProcessor';
import { Zap, Clock } from 'lucide-react';

// Format dateISO (YYYY-MM-DD) to display format
function formatDateDisplay(dateISO: string): string {
  const [year, month, day] = dateISO.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
  const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1];
  return `${dayName}, ${monthName} ${day}, ${year}`;
}

function formatMonthDay(dateISO: string): string {
  const [year, month, day] = dateISO.split('-').map(Number);
  const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month - 1];
  return `${monthName} ${day}`;
}

interface SessionHighlightsProps {
  stats: ProcessedStats;
}

export function SessionHighlights({ stats }: SessionHighlightsProps) {
  const { topSessions } = stats;

  if (topSessions.length === 0) {
    return (
      <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
        <h2 className="section-title flex items-center gap-3">
          <Zap className="w-7 h-7 text-yellow-500" />
          Monster Sessions
        </h2>
        <p className="text-muted-foreground text-lg">
          Your epic study sessions will appear here!
        </p>
      </div>
    );
  }

  return (
    <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
      <h2 className="section-title flex items-center gap-3">
        <Zap className="w-7 h-7 text-yellow-500" />
        Monster Sessions
      </h2>
      
      <p className="text-muted-foreground mb-6">
        Your top 5 longest study sessions
      </p>

      <div className="space-y-3">
        {topSessions.map((session, index) => (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
          >
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg
              ${index === 0 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-secondary text-muted-foreground'}
            `}>
              {index + 1}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground">
                {formatDateDisplay(session.dateISO)}
              </div>
              <div className="text-muted-foreground text-sm flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {session.startHHMM} — {session.endHHMM}
              </div>
            </div>
            
            <div className={`
              text-right font-bold text-lg
              ${index === 0 ? 'text-yellow-500' : 'text-primary'}
            `}>
              {formatDuration(session.minutes)}
            </div>
          </div>
        ))}
      </div>

      {topSessions[0] && (
        <div className="mt-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-foreground">
            🏆 Your record session was <span className="font-bold text-yellow-500">{formatDuration(topSessions[0].minutes)}</span> on{' '}
            {formatMonthDay(topSessions[0].dateISO)}. Absolute legend.
          </p>
        </div>
      )}
    </div>
  );
}