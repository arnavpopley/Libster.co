import { ProcessedStats } from '@/lib/libraryWrappedProcessor';
import { TimeRange } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Calendar } from 'lucide-react';

interface MonthChartProps {
  stats: ProcessedStats;
  dateRange?: TimeRange;
}

// Format date as "D Mon YYYY" (e.g., "26 Apr 2025")
function formatDateShort(date: Date): string {
  const day = date.getUTCDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  return `${day} ${month} ${year}`;
}

export function MonthChart({ stats, dateRange }: MonthChartProps) {
  const { monthlyData } = stats;

  const dateRangeLabel = dateRange 
    ? `${formatDateShort(dateRange.from)} – ${formatDateShort(dateRange.to)}`
    : null;

  if (monthlyData.length === 0) {
    return (
      <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
        <h2 className="section-title flex items-center gap-3">
          <Calendar className="w-7 h-7 text-primary" />
          Month-by-Month
          {dateRangeLabel && (
            <span className="text-sm font-normal text-muted-foreground">({dateRangeLabel})</span>
          )}
        </h2>
        <p className="text-muted-foreground text-lg">
          No data yet. Start visiting the library!
        </p>
      </div>
    );
  }

  const maxMinutes = Math.max(...monthlyData.map(d => d.minutes));

  const data = monthlyData.map(d => ({
    ...d,
    hours: Math.round(d.minutes / 60 * 10) / 10,
    label: d.month.split(' ')[0], // Just the month name
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">{data.month}</p>
          <p className="text-muted-foreground">
            {data.minutes.toLocaleString()} minutes
          </p>
          <p className="text-muted-foreground">
            ≈ {data.hours} hours
          </p>
          <p className="text-primary text-sm mt-1">
            {data.sessions} sessions
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
      <h2 className="section-title flex items-center gap-3">
        <Calendar className="w-7 h-7 text-primary" />
        Month-by-Month
        {dateRangeLabel && (
          <span className="text-sm font-normal text-muted-foreground">({dateRangeLabel})</span>
        )}
      </h2>
      
      <div className="h-[300px] mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="label" 
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
              tickFormatter={(value) => `${Math.round(value / 60)}h`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted) / 0.3)' }} />
            <Bar 
              dataKey="minutes" 
              radius={[6, 6, 0, 0]}
              maxBarSize={60}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={`hsl(160 84% ${39 + (entry.minutes / maxMinutes) * 20}%)`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
