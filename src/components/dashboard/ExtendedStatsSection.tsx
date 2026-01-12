import { ProcessedStats } from '@/lib/libraryWrappedProcessor';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface DayOfWeekChartProps {
  stats: ProcessedStats;
}

export function DayOfWeekChart({ stats }: DayOfWeekChartProps) {
  const { dayOfWeekData } = stats;

  // Handle empty data
  if (!dayOfWeekData || dayOfWeekData.length === 0) {
    return (
      <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
        <h2 className="section-title">Average Weekly Distribution</h2>
        <p className="text-muted-foreground">No data available for this period.</p>
      </div>
    );
  }

  // Find best and worst days based on share percentage
  const bestDay = dayOfWeekData.reduce((best, current) => 
    current.sharePercent > best.sharePercent ? current : best
  , dayOfWeekData[0]);
  
  const worstDay = dayOfWeekData.reduce((worst, current) => 
    current.sharePercent < worst.sharePercent && current.minutes > 0 ? current : worst
  , dayOfWeekData.find(d => d.minutes > 0) || dayOfWeekData[0]);

  const colors = [
    'hsl(340 80% 55%)', // Sun - pink
    'hsl(200 84% 50%)', // Mon - blue
    'hsl(160 84% 45%)', // Tue - teal
    'hsl(160 84% 39%)', // Wed - green
    'hsl(200 84% 50%)', // Thu - blue
    'hsl(280 84% 60%)', // Fri - purple
    'hsl(340 80% 55%)', // Sat - pink
  ];

  // Reorder to Mon-Sun for display
  const orderedColors = [colors[1], colors[2], colors[3], colors[4], colors[5], colors[6], colors[0]];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalHours = Math.floor(data.minutes / 60);
      const totalMins = Math.round(data.minutes % 60);
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.day}</p>
          <p className="text-primary font-medium">
            Share of weekly time: {data.sharePercent.toFixed(1)}%
          </p>
          <p className="text-muted-foreground">
            Total time: {totalHours}h {totalMins}m
          </p>
          <p className="text-muted-foreground text-sm">
            {data.totalVisits} visits
          </p>
        </div>
      );
    }
    return null;
  };

  // Map abbreviations to full day names
  const dayNameMap: Record<string, string> = {
    'Mon': 'Mondays', 'Tue': 'Tuesdays', 'Wed': 'Wednesdays', 
    'Thu': 'Thursdays', 'Fri': 'Fridays', 'Sat': 'Saturdays', 'Sun': 'Sundays'
  };

  const isWeekend = bestDay.day === 'Sat' || bestDay.day === 'Sun';
  const bestDayFull = dayNameMap[bestDay.day] || `${bestDay.day}s`;
  const insight = isWeekend
    ? `Weekend-heavy routine — ${bestDayFull} take the lead (${bestDay.sharePercent.toFixed(0)}%).`
    : bestDay.day === 'Wed'
    ? `Your week peaks on Wednesdays (${bestDay.sharePercent.toFixed(0)}% of your library time).`
    : `${bestDayFull} lead your week with ${bestDay.sharePercent.toFixed(0)}% of your library time.`;

  return (
    <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
      <h2 className="section-title flex items-center gap-3">
        <TrendingUp className="w-7 h-7 text-accent" />
        Average Weekly Distribution
      </h2>
      
      <div className="h-[250px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dayOfWeekData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="day" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${Math.round(value)}%`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Bar 
              dataKey="sharePercent" 
              radius={[6, 6, 0, 0]}
              maxBarSize={50}
            >
              {dayOfWeekData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={orderedColors[index]}
                  opacity={entry.totalVisits > 0 ? 1 : 0.3}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 p-4 rounded-xl bg-accent/10 border border-accent/20">
        <p className="text-foreground font-medium">
          💡 {insight}
        </p>
        {worstDay.day !== bestDay.day && worstDay.minutes > 0 && (
          <p className="text-muted-foreground text-sm mt-1">
            {dayNameMap[worstDay.day] || `${worstDay.day}s`} could use some love though — only {worstDay.sharePercent.toFixed(0)}%.
          </p>
        )}
      </div>
    </div>
  );
}