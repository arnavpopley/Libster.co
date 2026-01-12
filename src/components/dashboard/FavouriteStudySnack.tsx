import { Input } from "@/components/ui/input";
import { Cookie } from "lucide-react";

interface FavouriteStudySnackProps {
  snack: string;
  onSnackChange: (snack: string) => void;
}

export function FavouriteStudySnack({ snack, onSnackChange }: FavouriteStudySnackProps) {
  return (
    <div className="gradient-card rounded-2xl p-6 md:p-8 border border-border/50 animate-fade-in">
      <h2 className="section-title flex items-center gap-3">
        <Cookie className="w-7 h-7 text-amber-500" />
        Favourite Study Snack
      </h2>

      <p className="text-muted-foreground mb-6">What's your go-to study snack?</p>

      <Input
        type="text"
        placeholder="Enter your favourite snack..."
        value={snack}
        onChange={(e) => onSnackChange(e.target.value)}
        className="w-full bg-secondary/50 border-border/50 h-14 text-lg"
        maxLength={50}
      />

      {snack && (
        <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-foreground">
            Your go-to fuel 🔋: <span className="font-bold text-amber-500">{snack}</span>
          </p>
        </div>
      )}
    </div>
  );
}
