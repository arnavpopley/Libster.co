import { ProcessedStats } from "@/lib/libraryWrappedProcessor";
import { PieChart as PieChartIcon, Pie, Cell, ResponsiveContainer, Tooltip, PieChart } from "recharts";
import { Clock, Zap, Flame, Lock, ChartPie } from "lucide-react";

interface VisitTypePieChartProps {
  stats: ProcessedStats;
  compact?: boolean;
}

const VISIT_TYPE_CONFIG = [
  { key: "quick", label: "Quick", range: "< 1 hour", color: "#facc15", icon: Zap },
  { key: "standard", label: "Standard", range: "1-3 hours", color: "#60a5fa", icon: Clock },
  { key: "long", label: "Long", range: "3-6 hours", color: "#fb923c", icon: Flame },
  { key: "marathon", label: "Locked In", range: "> 6 hours", color: "#7c3aed", icon: Lock },
] as const;

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      range: string;
      percentage: number;
      color: string;
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const config = VISIT_TYPE_CONFIG.find((c) => c.label === data.name);
  const Icon = config?.icon || Clock;

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-5 h-5" style={{ color: data.color }} />
        <span className="font-semibold">{data.name}</span>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Visits:</span>
          <span className="font-medium">{data.value}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Percentage:</span>
          <span className="font-medium">{data.percentage}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-muted-foreground">Duration:</span>
          <span className="font-medium">{data.range}</span>
        </div>
      </div>
    </div>
  );
}

export function VisitTypePieChart({ stats, compact = false }: VisitTypePieChartProps) {
  const { visitTypeBreakdown } = stats;
  const totalVisits =
    visitTypeBreakdown.quick + visitTypeBreakdown.standard + visitTypeBreakdown.long + visitTypeBreakdown.marathon;

  const data = VISIT_TYPE_CONFIG.map((config) => ({
    name: config.label,
    value: visitTypeBreakdown[config.key],
    range: config.range,
    color: config.color,
    percentage: totalVisits > 0 ? Math.round((visitTypeBreakdown[config.key] / totalVisits) * 100) : 0,
  })).filter((d) => d.value > 0);

  if (totalVisits === 0) {
    return (
      <div className="gradient-card rounded-2xl p-6 border border-border/50 animate-fade-in">
        <h3 className="section-title flex items-center gap-2">
          <ChartPie className="w-6 h-6 text-primary" />
          Visit Type Breakdown
        </h3>
        <p className="text-muted-foreground">No visits recorded yet.</p>
      </div>
    );
  }

  return (
    <div
      className={`gradient-card rounded-2xl border border-border/50 animate-fade-in ${compact ? "p-4" : "p-4 sm:p-6"}`}
    >
      <h3
        className={`flex items-center gap-2 ${compact ? "text-lg font-bold mb-3" : "text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6"}`}
      >
        <ChartPie className={`text-primary ${compact ? "w-5 h-5" : "w-6 h-6"}`} />
        Visit Type Breakdown
      </h3>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Pie Chart */}
        <div className={compact ? "w-32 h-32" : "w-36 h-36 sm:w-48 sm:h-48 shrink-0"}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={compact ? 20 : 30}
                outerRadius={compact ? 50 : 55}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="hover:opacity-80 transition-opacity cursor-pointer"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="w-full sm:flex-1 space-y-2">
          {VISIT_TYPE_CONFIG.map((config) => {
            const count = visitTypeBreakdown[config.key];
            const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
            const Icon = config.icon;

            if (count === 0) return null;

            return (
              <div
                key={config.key}
                className={`flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors ${compact ? "text-xs" : "text-xs sm:text-sm"}`}
              >
                <Icon
                  className={compact ? "w-4 h-4 shrink-0" : "w-4 h-4 sm:w-5 sm:h-5 shrink-0"}
                  style={{ color: config.color }}
                />
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{config.label}</span>
                  <span className="text-muted-foreground ml-1 hidden sm:inline">({config.range})</span>
                </div>
                <span className="text-muted-foreground shrink-0">{count}</span>
                <span className="font-semibold shrink-0" style={{ color: config.color }}>
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Export config for use in recap
export { VISIT_TYPE_CONFIG };
