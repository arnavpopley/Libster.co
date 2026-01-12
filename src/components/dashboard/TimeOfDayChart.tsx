import { ProcessedStats } from '@/lib/libraryWrappedProcessor';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Clock } from 'lucide-react';

interface TimeOfDayChartProps {
  stats: ProcessedStats;
}

export function TimeOfDayChart({ stats }: TimeOfDayChartProps) {
  const { hourlyData, peakStudyHours } = stats;

  const formatHour = (hour: number) => {
    if (hour === 0) return '12am';
    if (hour === 12) return '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  // Handle empty data
  if (!hourlyData || hourlyData.length === 0 || !peakStudyHours) {
    return (
      <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
        <h2 className="section-title">Peak Study Hours</h2>
        <p className="text-muted-foreground">No data available for this period.</p>
      </div>
    );
  }

  // Convert shares to percentages for display
  const data = hourlyData.map(d => ({
    ...d,
    label: formatHour(d.hour),
    sharePercent: Math.round(d.share * 100 * 10) / 10, // one decimal place
  }));

  // Check if hour is within the peak window (handles wrap-around)
  const isInPeakWindow = (hour: number): boolean => {
    const { windowStart, windowEnd } = peakStudyHours;
    if (windowStart < windowEnd) {
      return hour >= windowStart && hour < windowEnd;
    } else {
      // Wraps around midnight
      return hour >= windowStart || hour < windowEnd;
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const isPeak = isInPeakWindow(d.hour);
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{d.label}</p>
          <p className="text-muted-foreground">
            {d.sharePercent}% of study time
          </p>
          {isPeak && (
            <p className="text-primary text-sm mt-1">✨ Peak window</p>
          )}
        </div>
      );
    }
    return null;
  };

  const personaEmoji = () => {
    if (peakStudyHours.isBalanced) return '⚖️';
    switch (peakStudyHours.persona) {
      case 'early bird': return '🌅';
      case 'daytime studier': return '☀️';
      case 'afternoon grinder': return '💪';
      case 'evening warrior': return '🌆';
      case 'night owl': return '🦉';
      default: return '📚';
    }
  };

  return (
    <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
      <h2 className="section-title flex items-center gap-3">
        <Clock className="w-7 h-7 text-blue-400" />
        Peak Study Hours
      </h2>
      
      <div className="h-[200px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorShare" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(200 84% 50%)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(200 84% 50%)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="label" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              hide
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="sharePercent" 
              stroke="hsl(200 84% 50%)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorShare)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center">
        <p className="text-lg font-semibold text-foreground">
          {personaEmoji()} {peakStudyHours.displayRange}
        </p>
        <p className="text-muted-foreground mt-1">
          {Math.round(peakStudyHours.windowShare * 100)}% of your study time falls in this window
        </p>
      </div>
    </div>
  );
}
