import { MapPin, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const STUDY_SPOTS = [
  { value: 'level-1-silent', label: 'Level 1 (Silent Study Zone)' },
  { value: 'level-1-group', label: 'Level 1 (Group Study Zone)' },
  { value: 'level-2-silent', label: 'Level 2 (Silent Study Zone)' },
  { value: 'level-3-silent', label: 'Level 3 (Silent Study Zone)' },
  { value: 'level-4-whisper', label: 'Level 4 (Whispering Zone)' },
  { value: 'level-4-group', label: 'Level 4 (Group Study Zone)' },
  { value: 'level-5-whisper', label: 'Level 5 (Whispering Zone)' },
  { value: 'private-study-rooms', label: 'Private Study Rooms' },
] as const;

export type StudySpotValue = typeof STUDY_SPOTS[number]['value'];

interface FavouriteStudySpotProps {
  selectedSpot: StudySpotValue | null;
  onSpotChange: (spot: StudySpotValue) => void;
}

export function FavouriteStudySpot({ selectedSpot, onSpotChange }: FavouriteStudySpotProps) {
  const selectedLabel = STUDY_SPOTS.find(s => s.value === selectedSpot)?.label;

  return (
    <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
      <h2 className="section-title flex items-center gap-3">
        <MapPin className="w-7 h-7 text-emerald-500" />
        Favourite Study Spot
      </h2>
      
      <p className="text-muted-foreground mb-6">
        Where do you usually set up camp?
      </p>

      <Select value={selectedSpot || undefined} onValueChange={(v) => onSpotChange(v as StudySpotValue)}>
        <SelectTrigger className="w-full bg-secondary/50 border-border/50 h-14 text-lg">
          <SelectValue placeholder="Select your favourite spot..." />
        </SelectTrigger>
        <SelectContent className="bg-background border-border z-[200]">
          {STUDY_SPOTS.map((spot) => (
            <SelectItem 
              key={spot.value} 
              value={spot.value}
              className="text-base py-3 cursor-pointer"
            >
              {spot.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedLabel && (
        <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-foreground">
            📍 Your go-to spot: <span className="font-bold text-emerald-500">{selectedLabel}</span>
          </p>
        </div>
      )}
    </div>
  );
}
