import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ProcessedStats } from "@/lib/libraryWrappedProcessor";
import { fetchLibraryStats, getTimeRanges, TimeRange } from "@/lib/api";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { StreaksSection } from "@/components/dashboard/StreaksSection";
import { MonthChart } from "@/components/dashboard/MonthChart";
import { DayOfWeekChart } from "@/components/dashboard/DayOfWeekChart";
import { TimeOfDayChart } from "@/components/dashboard/TimeOfDayChart";
import { SessionHighlights } from "@/components/dashboard/SessionHighlights";
import { TimeRangeSelector } from "@/components/dashboard/TimeRangeSelector";
import { LibraryWrapped } from "@/components/dashboard/LibraryWrapped";
//import { ExtendedStatsSection } from "@/components/dashboard/ExtendedStatsSection";
import { VisitTypePieChart } from "@/components/dashboard/VisitTypePieChart";
import { FavouriteStudySpot, StudySpotValue } from "@/components/dashboard/FavouriteStudySpot";
import { FavouriteStudySnack } from "@/components/dashboard/FavouriteStudySnack";
import { ShareableSummary } from "@/components/dashboard/ShareableSummary";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2, Sparkles, Share } from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import libsterFullLogo from '@/assets/libster_full_logo.png';
import libsterLLogo from '@/assets/libster_l_logo.png';

const FAVOURITE_SPOT_KEY = 'library-wrapped-favourite-spot';
const FAVOURITE_SNACK_KEY = 'library-wrapped-favourite-snack';

const Dashboard = () => {
  const { user, isAuthenticated, isLoading: authLoading, logout, accessToken } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<ProcessedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>(getTimeRanges()[0]);
  const [showWrapped, setShowWrapped] = useState(false);
  const [hasSeenWrapped, setHasSeenWrapped] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const shareableRef = useRef<HTMLDivElement>(null);
  const [favouriteSpot, setFavouriteSpot] = useState<StudySpotValue | null>(() => {
    const saved = localStorage.getItem(FAVOURITE_SPOT_KEY);
    return saved as StudySpotValue | null;
  });
  const [favouriteSnack, setFavouriteSnack] = useState<string>(() => {
    return localStorage.getItem(FAVOURITE_SNACK_KEY) || '';
  });

  const handleSpotChange = (spot: StudySpotValue) => {
    setFavouriteSpot(spot);
    localStorage.setItem(FAVOURITE_SPOT_KEY, spot);
  };

  const handleSnackChange = (snack: string) => {
    setFavouriteSnack(snack);
    localStorage.setItem(FAVOURITE_SNACK_KEY, snack);
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch data when range changes
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const processedStats = await fetchLibraryStats(selectedRange.from, selectedRange.to, accessToken);
        setStats(processedStats);

        // Show recap on first load if there's data and user hasn't seen it
        if (!hasSeenWrapped && processedStats.totalSessions > 0) {
          setShowWrapped(true);
          setHasSeenWrapped(true);
        }
      } catch (err) {
        setError("Failed to load your library data. Please try again.");
        console.error("Failed to fetch library usage:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedRange, isAuthenticated, accessToken, hasSeenWrapped]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleShare = async () => {
    if (!shareableRef.current || !stats) return;
    
    setIsSharing(true);
    
    try {
      // Wait for the component to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(shareableRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob'));
        }, 'image/png', 1.0);
      });
      
      const file = new File([blob], 'Libster-library-recap-2025.png', { type: 'image/png' });
      
      // Check if Web Share API is supported with files
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Library Recap 2025',
          text: 'Check out my Library Recap 2025! 📚',
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Libster-library-recap-2025.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Image downloaded! You can share it manually.');
      }
    } catch (err) {
      console.error('Share failed:', err);
      if ((err as Error).name !== 'AbortError') {
        toast.error('Failed to share. Please try again.');
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Library Recap Modal */}
      {stats && (
        <LibraryWrapped
          stats={stats}
          isOpen={showWrapped}
          onClose={() => setShowWrapped(false)}
          userName={user?.name}
          favouriteSpot={favouriteSpot}
          onSpotChange={handleSpotChange}
          favouriteSnack={favouriteSnack}
          onSnackChange={handleSnackChange}
        />
      )}

      <div className="min-h-screen pb-16 overflow-x-hidden">
        {/* Header */}
        <header className="sticky top-0 z-50 glass border-b border-border/50">
          <div className="container mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <img src={libsterLLogo} alt="Libster" className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <h1 className="font-bold truncate">Libster</h1>
                <p className="text-xs text-muted-foreground truncate">{user?.name}</p>
              </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="shrink-0">
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Welcome section */}
          <div className="mb-6 sm:mb-8 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Hey, <span className="gradient-text">{user?.name?.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg">Here's your library journey so far</p>
          </div>

          {/* Time range selector with Recap and Share buttons */}
          <div className="mb-6 sm:mb-8 animate-fade-in flex flex-wrap items-center gap-2 sm:gap-3" style={{ animationDelay: "100ms" }}>
            <TimeRangeSelector selected={selectedRange} onSelect={setSelectedRange} />
            {stats && stats.totalSessions > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWrapped(true)}
                  className="gap-2 border-primary/50 hover:border-primary hover:bg-primary/10"
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Library Recap 2025</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  disabled={isSharing}
                  className="gap-2 border-yellow-500/50 hover:border-yellow-500 hover:bg-yellow-500/10"
                >
                  {isSharing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-yellow-500" />
                  ) : (
                    <Share className="w-4 h-4 text-yellow-500" />
                  )}
                  <span>Share</span>
                </Button>
              </>
            )}
          </div>

          {/* Hidden shareable summary for capturing */}
          {stats && (
            <div className="fixed -left-[9999px] top-0">
              <ShareableSummary ref={shareableRef} stats={stats} favouriteSpot={favouriteSpot} />
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Crunching your library stats...</p>
            </div>
          )}

          {/* Error state */}
          {error && !isLoading && (
            <div className="gradient-card rounded-2xl p-8 border border-destructive/50 text-center">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => setSelectedRange({ ...selectedRange })}>Try Again</Button>
            </div>
          )}

          {/* Stats content */}
          {stats && !isLoading && !error && stats.totalSessions > 0 && (
            <div className="space-y-8">
              {/* Summary cards */}
              <SummaryCards stats={stats} />

              {/* Favourites - Spot and Snack side by side */}
              <div className="grid lg:grid-cols-2 gap-8">
                <FavouriteStudySpot 
                  selectedSpot={favouriteSpot} 
                  onSpotChange={handleSpotChange} 
                />
                <FavouriteStudySnack 
                  snack={favouriteSnack} 
                  onSnackChange={handleSnackChange} 
                />
              </div>

              {/* Streaks and Visit Type Breakdown side by side */}
              <div className="grid lg:grid-cols-2 gap-8">
                <StreaksSection stats={stats} />
                <VisitTypePieChart stats={stats} />
              </div>

              {/* Session Highlights */}
              <SessionHighlights stats={stats} />

              {/* Charts */}
              <MonthChart stats={stats} dateRange={selectedRange} />

              <div className="grid lg:grid-cols-2 gap-8">
                <DayOfWeekChart stats={stats} />
                <TimeOfDayChart stats={stats} />
              </div>

              {/* Footer message */}
              <div className="text-center py-12 animate-fade-in">
                <p className="text-muted-foreground">Keep up the great work! 📚</p>
                <p className="text-sm text-muted-foreground/60 mt-2">
                  Data reflects library visits from {selectedRange.label.toLowerCase()}
                </p>
                {/* Feedback section */}
                <p className="text-sm text-muted-foreground mt-6">
                  For suggestions, improvements, or feedback, please email{' '}
                  <a href="mailto:ap2424@ic.ac.uk" className="text-primary hover:underline">
                    ap2424@ic.ac.uk
                  </a>
                </p>
                {/* Libster full logo */}
                <div className="mt-8 flex justify-center">
                  <img src={libsterFullLogo} alt="Libster" className="h-10 w-auto opacity-70" />
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {stats && stats.totalSessions === 0 && !isLoading && !error && (
            <div className="gradient-card rounded-2xl p-12 text-center border border-border/50">
              <div className="text-6xl mb-4">📚</div>
              <h2 className="text-2xl font-bold mb-2">No library visits yet</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                We couldn't find any library sessions for this time period. Try selecting a different date range or
                start visiting the library!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;