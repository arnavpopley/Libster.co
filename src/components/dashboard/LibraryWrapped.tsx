import { useState, useEffect } from 'react';
import { ProcessedStats, formatDuration } from '@/lib/libraryWrappedProcessor';
import noSeatsMeme from '@/assets/no-seats-meme.png';
import libsterFullLogo from '@/assets/libster_full_logo.png';
import { STUDY_SPOTS, StudySpotValue } from './FavouriteStudySpot';
import { VISIT_TYPE_CONFIG } from './VisitTypePieChart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  Calendar,
  Flame,
  Trophy,
  Timer,
  DoorOpen,
  MapPin,
  Cookie,
  Zap,
  Lock,
} from 'lucide-react';

interface LibraryWrappedProps {
  stats: ProcessedStats;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  favouriteSpot: StudySpotValue | null;
  onSpotChange: (spot: StudySpotValue) => void;
  favouriteSnack: string;
  onSnackChange: (snack: string) => void;
}

interface Slide {
  id: string;
  gradient: string;
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  emoji?: string;
  customContent?: React.ReactNode;
}

// Format minutes with commas (e.g., 12,345 minutes)
function formatMinutesWithCommas(minutes: number): string {
  return `${Math.round(minutes).toLocaleString()} minutes`;
}

// Format ISO date to DD-MM-YYYY
function formatDateDDMMYYYY(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

export function LibraryWrapped({ stats, isOpen, onClose, userName, favouriteSpot, onSpotChange, favouriteSnack, onSnackChange }: LibraryWrappedProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  // Track if wrapped was just opened to reset slide
  const [wasOpen, setWasOpen] = useState(false);
  
  useEffect(() => {
    if (isOpen && !wasOpen) {
      setCurrentSlide(0);
      setContentVisible(true);
    }
    setWasOpen(isOpen);
  }, [isOpen, wasOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle navigation keys when typing in an input
      const activeElement = document.activeElement;
      const isTyping = activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement;
      
      if (e.key === 'ArrowRight' || e.key === ' ') {
        if (isTyping && e.key === ' ') {
          // Allow space in input fields
          return;
        }
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        if (isTyping) return; // Allow arrow navigation in input
        e.preventDefault();
        goToPrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentSlide]);

  const selectedSpotLabel = STUDY_SPOTS.find(s => s.value === favouriteSpot)?.label || 'Not selected';

  const slides: Slide[] = [
    {
      id: 'intro',
      gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
      icon: <img src={libsterFullLogo} alt="Libster" className="w-48 h-auto" />,
      title: `${userName?.split(' ')[0]}'s`,
      value: 'Library Recap 2025',
      subtitle: 'Your year in the library',
    },
    {
      id: 'total-time',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      icon: <Clock className="w-16 h-16" />,
      title: 'Total Time',
      value: formatMinutesWithCommas(stats.totalMinutes),
      subtitle: `That's ≈${Math.round(stats.totalMinutes / 60).toLocaleString()} hours`,
    },
    {
      id: 'total-visits',
      gradient: 'from-blue-500 via-indigo-500 to-violet-500',
      icon: <Calendar className="w-16 h-16" />,
      title: 'Total Library Visits',
      value: stats.totalSessions.toString(),
      subtitle: `Number of times you visited the library this year`,
    },
    {
      id: 'longest-session',
      gradient: 'from-orange-500 via-red-500 to-pink-500',
      icon: <Trophy className="w-16 h-16" />,
      title: 'Longest Session',
      value: formatDuration(stats.longestSessionMinutes),
      subtitle: stats.longestSessionDateISO
        ? `On ${formatDateDDMMYYYY(stats.longestSessionDateISO)}. Beast mode!`
        : 'No sessions yet',
    },
    {
      id: 'favourite-spot',
      gradient: 'from-emerald-500 via-green-500 to-teal-500',
      icon: <MapPin className="w-16 h-16" />,
      title: 'Favourite Study Spot',
      value: selectedSpotLabel,
      subtitle: favouriteSpot ? 'Your go-to zone' : 'Select your spot below',
      customContent: (
        <div 
          className="mt-4 w-full max-w-xs" 
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Select value={favouriteSpot || undefined} onValueChange={(v) => onSpotChange(v as StudySpotValue)}>
            <SelectTrigger className="w-full bg-white/20 border-white/30 text-white h-12 backdrop-blur-sm hover:bg-white/30 transition-colors">
              <SelectValue placeholder="Choose your spot..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-[200]">
              {STUDY_SPOTS.map((spot) => (
                <SelectItem 
                  key={spot.value} 
                  value={spot.value}
                  className="text-sm py-2.5 cursor-pointer"
                >
                  {spot.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      id: 'best-streak',
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      icon: <Flame className="w-16 h-16" />,
      title: 'Best Streak',
      value: `${stats.longestVisitStreakDays} days`,
      subtitle: 'Most consecutive days in a row'
    },
    {
      id: 'average-session',
      gradient: 'from-cyan-500 via-blue-500 to-indigo-500',
      icon: <Timer className="w-16 h-16" />,
      title: 'Average Session',
      value: formatDuration(stats.averageSessionMinutes),
      subtitle: 'Your typical study session length',
    },
    {
      id: 'visit-types',
      gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
      icon: <Clock className="w-16 h-16" />,
      title: 'Your Study Session Types',
      value: '',
      subtitle: 'How you spend your time',
      customContent: (() => {
        const { visitTypeBreakdown } = stats;
        const totalVisits = visitTypeBreakdown.quick + visitTypeBreakdown.standard + visitTypeBreakdown.long + visitTypeBreakdown.marathon;
        
        const data = VISIT_TYPE_CONFIG.map(config => ({
          name: config.label,
          value: visitTypeBreakdown[config.key],
          color: config.color,
          percentage: totalVisits > 0 ? Math.round((visitTypeBreakdown[config.key] / totalVisits) * 100) : 0,
        })).filter(d => d.value > 0);

        const iconMap = { quick: Zap, standard: Clock, long: Flame, marathon: Lock };

        return (
          <div className="flex flex-col items-center gap-2 mt-4 sm:mt-0 pb-14 sm:pb-0">
            <div className="w-32 h-32 sm:w-40 sm:h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
              {VISIT_TYPE_CONFIG.map(config => {
                const count = visitTypeBreakdown[config.key];
                const percentage = totalVisits > 0 ? Math.round((count / totalVisits) * 100) : 0;
                const Icon = iconMap[config.key];
                
                if (count === 0) return null;
                
                return (
                  <div 
                    key={config.key} 
                    className="flex items-center gap-2 p-2 rounded-lg bg-white/20 backdrop-blur-sm text-xs"
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                    <div className="flex-1">
                      <span>{config.label}</span>
                      <span className="opacity-70 ml-1">({config.range})</span>
                    </div>
                    <span className="font-bold">{percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })(),
    },
    {
      id: 'favourite-snack',
      gradient: 'from-amber-500 via-orange-500 to-yellow-500',
      icon: <Cookie className="w-16 h-16" />,
      title: 'Favourite Study Snack',
      value: favouriteSnack || 'Not set',
      subtitle: favouriteSnack ? 'Yum!' : 'What keeps you going?',
      customContent: (
        <div 
          className="mt-4 w-full max-w-xs" 
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <Input
            type="text"
            placeholder="Enter your snack..."
            value={favouriteSnack}
            onChange={(e) => onSnackChange(e.target.value)}
            className="w-full bg-white/20 border-white/30 text-white placeholder:text-white/60 h-12 backdrop-blur-sm hover:bg-white/30 transition-colors text-center"
            maxLength={30}
          />
        </div>
      ),
    },
    {
      id: 'quick-exits',
      gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
      icon: <DoorOpen className="w-16 h-16" />,
      title: 'Quick Exits',
      value: stats.noSeat.count.toString(),
      subtitle: `Sessions ≤ ${stats.noSeat.maxMinutes} min (${stats.noSeat.sharePctOfRawSessions.toFixed(1)}% of visits)`,
      customContent: (
        <div className="mt-4">
          <img 
            src={noSeatsMeme} 
            alt="No seats?" 
            className="w-48 h-auto rounded-lg shadow-lg"
          />
        </div>
      ),
    },
    {
      id: 'summary',
      gradient: 'from-indigo-600 via-violet-600 to-purple-600',
      icon: null,
      title: '',
      value: '',
      subtitle: '',
      customContent: (() => {
        // Helper to format streak dates as "XX Jan - YY Feb"
        const formatStreakDates = (startDate: Date, endDate: Date): string => {
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const startDay = startDate.getUTCDate();
          const startMonth = months[startDate.getUTCMonth()];
          const endDay = endDate.getUTCDate();
          const endMonth = months[endDate.getUTCMonth()];
          return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
        };

        return (
          <div className="flex flex-col h-full w-full px-3 pt-6 pb-16">
            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-black mb-3 sm:mb-4 text-center">Library Recap 2025</h1>
            
            {/* 2x3 Grid */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              {/* Row 1: Total Time */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1 rounded bg-gradient-to-br from-teal-400 to-cyan-500">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium opacity-90">Total Time</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalMinutes.toLocaleString()} min</div>
                <div className="text-sm sm:text-base opacity-70 font-normal">≈ {Math.round(stats.totalMinutes / 60).toLocaleString()} hours</div>
              </div>
              
              {/* Row 1: Total Visits */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1 rounded bg-gradient-to-br from-violet-400 to-purple-500">
                    <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium opacity-90">Total Visits</span>
                </div>
                <div className="text-xl sm:text-2xl font-bold">{stats.totalSessions}</div>
                <div className="text-sm sm:text-base opacity-70">library sessions</div>
              </div>
              
              {/* Row 2: Longest Sessions (top 3) */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1 rounded bg-gradient-to-br from-orange-400 to-rose-500">
                    <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium opacity-90">Longest Sessions</span>
                </div>
                <div className="space-y-0">
                  {stats.topSessions.slice(0, 3).map((session, i) => {
                    const sessionDate = new Date(session.dateISO);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const dateStr = `${sessionDate.getUTCDate()} ${months[sessionDate.getUTCMonth()]}`;
                    return (
                      <div key={i} className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-xs sm:text-sm opacity-60">{i + 1}.</span>
                        <span className="font-bold text-base sm:text-lg">{formatDuration(session.minutes)}</span>
                        <span className="text-[10px] sm:text-xs opacity-60 font-normal">({dateStr})</span>
                      </div>
                    );
                  })}
                  {stats.topSessions.length === 0 && (
                    <div className="text-base opacity-70">No sessions</div>
                  )}
                </div>
              </div>
              
              {/* Row 2: Best Streaks (top 3) */}
              <div className="bg-white/15 backdrop-blur-sm rounded-xl p-2 sm:p-3 flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-1">
                  <div className="p-1 rounded bg-orange-500">
                    <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium opacity-90">Best Streaks</span>
                </div>
                <div className="space-y-0">
                  {stats.topStreaks.slice(0, 3).map((streak, i) => (
                    <div key={i} className="flex items-baseline gap-1 flex-wrap">
                      <span className="text-xs sm:text-sm opacity-60">{i + 1}.</span>
                      <span className="font-bold text-base sm:text-lg">{streak.days} days</span>
                      <span className="text-[10px] sm:text-xs opacity-60 font-normal">({formatStreakDates(streak.startDate, streak.endDate)})</span>
                    </div>
                  ))}
                  {stats.topStreaks.length === 0 && (
                    <div className="text-base opacity-70">No streaks</div>
                  )}
                </div>
              </div>
              
              {/* Row 3: Favourite Spot (spans full width) */}
              <div className="col-span-2 bg-white/15 backdrop-blur-sm rounded-xl p-1.5 flex items-center justify-center gap-1.5">
                <div className="p-1 rounded bg-gradient-to-br from-emerald-400 to-teal-500">
                  <MapPin className="w-3 h-3 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium opacity-90">Favourite Spot:</span>
                <span className="font-bold text-xs sm:text-sm">{selectedSpotLabel}</span>
              </div>
            </div>
            
            {/* Bottom: Logo left, Libster.co right */}
            <div className="absolute bottom-4 left-3 right-3 flex justify-between items-end">
              <img src={libsterFullLogo} alt="Libster" className="h-4 sm:h-5 w-auto opacity-90" />
              <span className="text-[10px] sm:text-xs font-semibold opacity-90">Libster.co</span>
            </div>
          </div>
        );
      })(),
    },
    {
      id: 'thank-you',
      gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
      icon: <img src={libsterFullLogo} alt="Libster" className="w-48 h-auto" />,
      title: '',
      value: 'Thank you for studying with Libster!',
      subtitle: 'See you next year ❤️',
    },
  ];

  const goToNext = () => {
    if (isTransitioning) return;
    if (currentSlide < slides.length - 1) {
      setDirection('next');
      setIsTransitioning(true);
      setContentVisible(false);
      
      setTimeout(() => {
        setCurrentSlide((prev) => prev + 1);
        setTimeout(() => {
          setContentVisible(true);
          setIsTransitioning(false);
        }, 100);
      }, 400);
    } else {
      onClose();
    }
  };

  const goToPrev = () => {
    if (isTransitioning) return;
    if (currentSlide > 0) {
      setDirection('prev');
      setIsTransitioning(true);
      setContentVisible(false);
      
      setTimeout(() => {
        setCurrentSlide((prev) => prev - 1);
        setTimeout(() => {
          setContentVisible(true);
          setIsTransitioning(false);
        }, 100);
      }, 400);
    }
  };

  if (!isOpen) return null;

  // Safety check: ensure currentSlide is within bounds
  const safeSlideIndex = Math.min(Math.max(0, currentSlide), slides.length - 1);
  const slide = slides[safeSlideIndex];
  
  if (!slide) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-1.5 sm:p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
      </button>

      {/* Progress dots */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-50">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1 rounded-full transition-all duration-300 ${
              idx === currentSlide ? 'w-6 bg-white' : idx < currentSlide ? 'w-4 bg-white/60' : 'w-4 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Story container */}
      <div
        className="relative mx-4 w-full max-w-md h-[calc(100vh-6rem)] max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl md:h-[88vh] md:aspect-[9/16] md:w-auto md:max-w-none md:max-h-none"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          if (clickX < rect.width / 3) {
            goToPrev();
          } else {
            goToNext();
          }
        }}
      >
        {/* Animated gradient background with smooth transition */}
        <div className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} transition-all duration-700 ease-out`} />
        
        {/* Libster full logo - top right corner of colored portion (hidden on intro, thank-you, and summary slides) */}
        {slide.id !== 'intro' && slide.id !== 'thank-you' && slide.id !== 'summary' && (
          <div 
            className="absolute top-4 right-4 z-50"
            style={{
              animation: contentVisible ? 'content-enter 0.6s ease-out forwards' : 'content-exit 0.4s ease-in forwards',
            }}
          >
            <img src={libsterFullLogo} alt="Libster" className="h-6 sm:h-8 w-auto" />
          </div>
        )}
        
        {/* Flowing animated background elements - hidden on summary slide */}
        {slide.id !== 'summary' && (
          <div className="absolute inset-0 overflow-hidden">
            {/* Large flowing orb - top right */}
            <div 
              className="absolute -top-20 -right-20 w-80 h-80 bg-white/25 rounded-full blur-3xl"
              style={{
                animation: 'float1 20s ease-in-out infinite',
              }}
            />
            {/* Medium flowing orb - bottom left */}
            <div 
              className="absolute -bottom-32 -left-32 w-96 h-96 bg-black/20 rounded-full blur-3xl"
              style={{
                animation: 'float2 20s ease-in-out infinite',
              }}
            />
            {/* Small accent orb - center */}
            <div 
              className="absolute top-1/3 left-1/4 w-48 h-48 bg-white/15 rounded-full blur-2xl"
              style={{
                animation: 'float3 20s ease-in-out infinite',
              }}
            />
            {/* Extra flowing element */}
            <div 
              className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"
              style={{
                animation: 'float4 20s ease-in-out infinite',
              }}
            />
            {/* New: Sweeping gradient wave */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(45deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
                animation: 'sweep 20s ease-in-out infinite',
              }}
            />
          </div>
        )}

        {/* Animated gradient overlay for extra flow */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%)',
            animation: 'pulse-glow 6s ease-in-out infinite',
          }}
        />

        {/* CSS for flowing animations */}
        <style>{`
          @keyframes float1 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            25% { transform: translate(40px, -30px) scale(1.15); }
            50% { transform: translate(20px, 20px) scale(1.05); }
            75% { transform: translate(-30px, -10px) scale(1.1); }
          }
          @keyframes float2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(50px, -40px) scale(1.2); }
            66% { transform: translate(-30px, 30px) scale(0.9); }
          }
          @keyframes float3 {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
            50% { transform: translate(-40px, 40px) scale(1.3); opacity: 0.9; }
          }
          @keyframes float4 {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(30px, -30px) rotate(8deg); }
            50% { transform: translate(-20px, 20px) rotate(-8deg); }
            75% { transform: translate(25px, 25px) rotate(5deg); }
          }
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(1.15); }
          }
          @keyframes sweep {
            0%, 100% { transform: translateX(-100%) rotate(45deg); }
            50% { transform: translateX(100%) rotate(45deg); }
          }
          @keyframes content-enter {
            0% { opacity: 0; transform: translateY(20px) scale(0.95); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes content-exit {
            0% { opacity: 1; transform: translateY(0) scale(0.95); }
            100% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          }
          @keyframes confetti-fall {
            0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0.6; }
          }
        `}</style>

        {/* Confetti overlay - only on thank-you slide - continuous falling */}
        {slide.id === 'thank-you' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
            {[...Array(40)].map((_, i) => (
              <div
                key={`confetti-${i}`}
                className="absolute w-2 h-3 rounded-sm"
                style={{
                  left: `${(i * 2.5) + Math.random() * 2}%`,
                  top: '-20px',
                  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#A78BFA', '#F472B6', '#34D399', '#FBBF24', '#60A5FA'][i % 8],
                  animation: `confetti-fall ${4 + Math.random() * 3}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        {slide.id === 'summary' ? (
          /* Summary slide: full-height custom layout */
          <div 
            className="relative h-full w-full text-white"
            style={{
              animation: contentVisible ? 'content-enter 0.6s ease-out forwards' : 'content-exit 0.4s ease-in forwards',
            }}
          >
            {slide.customContent}
          </div>
        ) : (
          <div 
            className={`relative h-full flex flex-col items-center text-white px-8 text-center ${slide.id === 'intro' ? 'justify-start pt-24' : 'justify-center'}`}
            style={{
              animation: contentVisible ? 'content-enter 0.6s ease-out forwards' : 'content-exit 0.4s ease-in forwards',
            }}
          >
            {/* Icon */}
            <div 
              className={`mb-6 ${slide.id === 'intro' ? '' : 'p-4 bg-white/20 rounded-full'} backdrop-blur-sm`}
              style={{ 
                animation: contentVisible ? 'content-enter 0.6s ease-out forwards' : undefined,
                animationDelay: contentVisible ? '100ms' : undefined,
                opacity: contentVisible ? undefined : 0,
              }}
            >
              {slide.icon}
            </div>

            {/* Title */}
            <p 
              className="text-lg font-medium opacity-90 mb-2"
              style={{ 
                animation: contentVisible ? 'content-enter 0.6s ease-out forwards' : undefined,
                animationDelay: contentVisible ? '200ms' : undefined,
                opacity: contentVisible ? undefined : 0,
              }}
            >
              {slide.title}
            </p>

            {/* Value */}
            <h2 
              className={`font-black mb-4 ${slide.id === 'favourite-spot' ? 'text-2xl md:text-3xl' : slide.id === 'thank-you' ? 'text-3xl md:text-4xl' : 'text-5xl md:text-6xl'}`}
              style={{ 
                animation: contentVisible ? 'content-enter 0.7s ease-out forwards' : undefined,
                animationDelay: contentVisible ? '300ms' : undefined,
                opacity: contentVisible ? undefined : 0,
              }}
            >
              {slide.value}
            </h2>

            {/* Emoji */}
            {slide.emoji && (
              <div 
                className="text-5xl mb-4"
                style={{ 
                  animation: contentVisible ? 'content-enter 0.6s ease-out forwards' : undefined,
                  animationDelay: contentVisible ? '400ms' : undefined,
                  opacity: contentVisible ? undefined : 0,
                }}
              >
                {slide.emoji}
              </div>
            )}

            {/* Subtitle */}
            <p 
              className={`text-base opacity-80 max-w-xs ${slide.id === 'visit-types' ? 'mb-2' : ''}`}
              style={{ 
                animation: contentVisible ? 'content-enter 0.6s ease-out forwards' : undefined,
                animationDelay: contentVisible ? '500ms' : undefined,
                opacity: contentVisible ? undefined : 0,
              }}
            >
              {slide.subtitle}
            </p>

            {/* Custom Content (e.g., dropdown) */}
            {slide.customContent && (
              <div 
                style={{ 
                  animation: contentVisible ? 'content-enter 0.6s ease-out forwards' : undefined,
                  animationDelay: contentVisible ? '600ms' : undefined,
                  opacity: contentVisible ? undefined : 0,
                }}
              >
                {slide.customContent}
              </div>
            )}
          </div>
        )}

        {/* Navigation hints - hidden on summary slide */}
        {slide.id !== 'summary' && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-between px-6">
            <div className={`flex items-center gap-1 text-white/50 text-sm ${currentSlide === 0 ? 'opacity-0' : ''}`}>
              <ChevronLeft className="w-4 h-4" />
              <span>Tap</span>
            </div>
            <div className="flex items-center gap-1 text-white/50 text-sm">
              <span>{currentSlide === slides.length - 1 ? 'Close' : 'Tap'}</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}