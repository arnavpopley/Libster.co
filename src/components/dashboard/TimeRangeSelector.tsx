import { TimeRange, getTimeRanges } from '@/lib/api';
import { Calendar, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TimeRangeSelectorProps {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
}

export function TimeRangeSelector({ selected, onSelect }: TimeRangeSelectorProps) {
  const ranges = getTimeRanges();

  return (
    <div className="flex items-center gap-3">
      <Calendar className="w-5 h-5 text-muted-foreground" />
      <Select
        value={selected.label}
        onValueChange={(label) => {
          const range = ranges.find(r => r.label === label);
          if (range) onSelect(range);
        }}
      >
        <SelectTrigger className="w-[280px] bg-secondary border-border">
          <SelectValue placeholder="Select time range" />
        </SelectTrigger>
        <SelectContent>
          {ranges.map((range) => (
            <SelectItem key={range.label} value={range.label}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}