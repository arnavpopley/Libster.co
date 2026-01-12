import { ProcessedStats } from '@/lib/libraryWrappedProcessor';
import { format } from 'date-fns';
import { Flame, Award, TrendingUp } from 'lucide-react';

interface StreaksSectionProps {
  stats: ProcessedStats;
}

export function StreaksSection({ stats }: StreaksSectionProps) {
  const { topStreaks } = stats;

  if (topStreaks.length === 0) {
    return (
      <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
        <h2 className="section-title flex items-center gap-3">
          <Flame className="w-7 h-7 text-orange-500" />
          Your Top Streaks
        </h2>
        <p className="text-muted-foreground text-lg">
          Keep showing up! You'll build streaks in no time.
        </p>
      </div>
    );
  }

  const medals = ['🥇', '🥈', '🥉'];
  const streakColors = [
    'from-yellow-500 to-amber-600',
    'from-slate-400 to-slate-500',
    'from-amber-700 to-orange-800',
  ];

  return (
    <div className="gradient-card rounded-2xl p-4 sm:p-6 md:p-8 border border-border/50 animate-fade-in">
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
        <Flame className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
        Your Top Streaks
      </h2>
      
      <div className="space-y-3 sm:space-y-4">
        {topStreaks.map((streak, index) => (
          <div
            key={index}
            className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl bg-secondary/50 hover:bg-secondary/80 transition-colors"
          >
            <div className="text-2xl sm:text-3xl shrink-0">{medals[index]}</div>
            
            <div className={`flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${streakColors[index]} shadow-lg shrink-0`}>
              <span className="text-lg sm:text-2xl font-black text-foreground">{streak.days}</span>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base sm:text-lg truncate">
                {streak.days} days in a row
              </div>
              <div className="text-muted-foreground text-sm truncate">
                {format(streak.startDate, 'MMM d')} — {format(streak.endDate, 'MMM d, yyyy')}
              </div>
            </div>
            
            {index === 0 && (
              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {topStreaks.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Your best streak was {topStreaks[0].days} days. Can you beat it this term?</span>
          </div>
          
        </div>
      )}
    </div>
  );
}
