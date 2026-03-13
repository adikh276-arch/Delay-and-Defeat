import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import hourglassImg from "@/assets/hourglass.png";

interface HistoryEntry {
  id: string;
  date: string;
  delayTime: number;
  urgeBefore: number;
  urgeAfter: number;
}

const DELAY_OPTIONS = [
  { label: "30 seconds", value: 30 },
  { label: "1 minute", value: 60 },
  { label: "2 minutes", value: 120 },
  { label: "3 minutes", value: 180 },
];

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.4, ease: "easeIn" } },
};

function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("delay-defeat-history") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entry: HistoryEntry) {
  const history = getHistory();
  history.unshift(entry);
  localStorage.setItem("delay-defeat-history", JSON.stringify(history));
}

function formatDelay(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  return `${seconds / 60} minute${seconds > 60 ? "s" : ""}`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DelayAndDefeat() {
  const [screen, setScreen] = useState(0);
  const [delayTime, setDelayTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [urgeBefore] = useState(() => Math.floor(Math.random() * 4) + 6);
  const [urgeAfter, setUrgeAfter] = useState(5);
  const [selectedDelay, setSelectedDelay] = useState<number | null>(null);

  const goNext = useCallback(() => setScreen((s) => s + 1), []);
  const goBack = useCallback(() => setScreen((s) => Math.max(0, s - 1)), []);

  // Timer logic
  useEffect(() => {
    if (screen !== 2) return;
    if (timeLeft <= 0) {
      goNext();
      return;
    }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [screen, timeLeft, goNext]);

  const startTimer = () => {
    setTimeLeft(delayTime);
    goNext();
  };

  const handleSave = () => {
    saveHistory({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      delayTime,
      urgeBefore,
      urgeAfter,
    });
    setScreen(5);
  };

  const restart = () => {
    setSelectedDelay(null);
    setUrgeAfter(5);
    setScreen(0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[400px] min-h-[85vh] bg-card rounded-3xl shadow-xl overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {screen === 0 && (
            <Screen key="intro" onNext={goNext} />
          )}
          {screen === 1 && (
            <SetDelayScreen
              key="delay"
              selected={selectedDelay}
              onSelect={(v) => { setSelectedDelay(v); setDelayTime(v); }}
              onStart={startTimer}
              onBack={goBack}
            />
          )}
          {screen === 2 && (
            <TimerScreen
              key="timer"
              timeLeft={timeLeft}
              total={delayTime}
              onSkip={goNext}
              onBack={goBack}
            />
          )}
          {screen === 3 && (
            <CheckUrgeScreen
              key="check"
              value={urgeAfter}
              onChange={setUrgeAfter}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {screen === 4 && (
            <VictoryScreen
              key="victory"
              delayTime={delayTime}
              urgeBefore={urgeBefore}
              urgeAfter={urgeAfter}
              onSave={handleSave}
              onRetry={restart}
              onViewHistory={() => setScreen(5)}
              onBack={goBack}
            />
          )}
          {screen === 5 && (
            <HistoryScreen
              key="history"
              onBack={() => setScreen(4)}
              onNewDelay={restart}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Screen 1 - Introduction
function Screen({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col flex-1 px-5 py-8"
    >
      <h1 className="text-2xl font-bold text-foreground mb-6 text-justify">
        Delay and Defeat ⏳
      </h1>

      <div className="flex justify-center mb-6">
        <img src={hourglassImg} alt="Hourglass" className="w-32 h-32 object-contain" />
      </div>

      <div className="flex-1 space-y-4 text-base text-foreground text-justified leading-relaxed">
        <p>Cravings often feel powerful in the moment.</p>
        <p>But most urges are temporary and fade with time.</p>
        <p>If you wait just a little while, the craving usually becomes weaker.</p>
        <p>Let's delay the urge and watch what happens.</p>
      </div>

      <div className="mt-8">
        <Button onClick={onNext} className="w-full" size="lg">
          Start Delay
        </Button>
      </div>
    </motion.div>
  );
}

// Screen 2 - Set Delay
function SetDelayScreen({
  selected,
  onSelect,
  onStart,
  onBack,
}: {
  selected: number | null;
  onSelect: (v: number) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col flex-1 px-5 py-8"
    >
      <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm mb-6 self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-4 text-justify">
        How long will you wait?
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed mb-8">
        <p>Choose a short delay before acting on the urge.</p>
        <p>During this time, simply observe the craving without reacting.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-auto">
        {DELAY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`py-3 px-4 rounded-2xl border-2 text-sm font-medium transition-all ${
              selected === opt.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:border-primary/40"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <Button onClick={onStart} className="w-full" size="lg" disabled={!selected}>
          Start Timer
        </Button>
      </div>
    </motion.div>
  );
}

// Screen 3 - Timer
function TimerScreen({
  timeLeft,
  total,
  onSkip,
  onBack,
}: {
  timeLeft: number;
  total: number;
  onSkip: () => void;
  onBack: () => void;
}) {
  const progress = total > 0 ? (total - timeLeft) / total : 0;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col flex-1 px-5 py-8 items-center"
    >
      <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm mb-6 self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-4 text-justify w-full">
        Stay with the moment
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed w-full mb-8">
        <p>Notice how the craving feels in your body.</p>
        <p>Urges rise and fall like waves.</p>
        <p>Watch the feeling without acting on it.</p>
      </div>

      <div className="relative flex items-center justify-center my-6">
        {/* Pulsing background ring */}
        <div className="absolute w-48 h-48 rounded-full bg-primary/15 animate-pulse-ring" />
        <div className="absolute w-56 h-56 rounded-full bg-primary/8 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />

        {/* Progress ring */}
        <svg className="w-44 h-44 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--accent))" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - progress)}`}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>

        <span className="absolute text-4xl font-bold text-foreground">
          {formatTime(timeLeft)}
        </span>
      </div>

      <p className="text-muted-foreground text-sm mt-4 italic">Just breathe and wait.</p>

      <div className="mt-auto w-full">
        <Button onClick={onSkip} variant="secondary" className="w-full" size="lg">
          Skip Timer
        </Button>
      </div>
    </motion.div>
  );
}

// Screen 4 - Check Urge
function CheckUrgeScreen({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: number;
  onChange: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col flex-1 px-5 py-8"
    >
      <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm mb-6 self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-4 text-justify">
        How strong is the urge now?
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed mb-10">
        <p>Take a moment to check in again.</p>
        <p>Did the craving stay the same, or did it change?</p>
      </div>

      <div className="flex justify-center gap-2 my-8">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={`w-6 h-6 rounded-full transition-all duration-300 ${
              i < value
                ? "bg-primary shadow-md scale-110"
                : "bg-accent"
            }`}
          />
        ))}
      </div>

      <div className="mt-auto">
        <Button onClick={onNext} className="w-full" size="lg">
          Next
        </Button>
      </div>
    </motion.div>
  );
}

// Screen 5 - Victory
function VictoryScreen({
  delayTime,
  urgeBefore,
  urgeAfter,
  onSave,
  onRetry,
  onViewHistory,
  onBack,
}: {
  delayTime: number;
  urgeBefore: number;
  urgeAfter: number;
  onSave: () => void;
  onRetry: () => void;
  onViewHistory: () => void;
  onBack: () => void;
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col flex-1 px-5 py-8"
    >
      <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm mb-6 self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-2 text-justify">
        You delayed the urge! 🎉
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed mb-6">
        <p>By waiting instead of reacting, you proved something important.</p>
        <p>Cravings do not control you.</p>
        <p>Each time you delay an urge, you build stronger self-control.</p>
      </div>

      {/* Summary Card */}
      <div className="bg-card rounded-2xl shadow-md p-5 space-y-4 mb-6 border border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Delay Time</span>
          <span className="text-sm font-bold text-foreground">{formatDelay(delayTime)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Urge Level Before</span>
          <div className="flex gap-1">
            {Array.from({ length: urgeBefore }, (_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-primary" />
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">Urge Level After</span>
          <div className="flex gap-1">
            {Array.from({ length: urgeAfter }, (_, i) => (
              <div key={i} className="w-3 h-3 rounded-full bg-secondary" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <Button onClick={onSave} className="w-full" size="lg">
          Save Progress
        </Button>
        <Button onClick={onRetry} variant="secondary" className="w-full" size="lg">
          Try Another Delay
        </Button>
        <Button onClick={onViewHistory} variant="outline" className="w-full" size="lg">
          View Past History
        </Button>
      </div>
    </motion.div>
  );
}

// Screen 6 - History
function HistoryScreen({
  onBack,
  onNewDelay,
}: {
  onBack: () => void;
  onNewDelay: () => void;
}) {
  const history = getHistory();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col flex-1 px-5 py-8"
    >
      <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm mb-6 self-start">
        <ArrowLeft size={16} /> Back
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6 text-justify">
        Your History 📊
      </h1>

      {history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center">No entries yet. Complete a delay to see your progress!</p>
        </div>
      ) : (
        <div className="flex-1 space-y-3 overflow-y-auto">
          {history.map((entry) => (
            <div key={entry.id} className="bg-card rounded-2xl shadow-sm p-4 border border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-muted-foreground">{entry.date}</span>
                <span className="text-xs font-medium text-primary">{formatDelay(entry.delayTime)}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Before:</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: entry.urgeBefore }, (_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-primary" />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">After:</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: entry.urgeAfter }, (_, i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-secondary" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={onNewDelay} className="w-full" size="lg">
          Start New Delay
        </Button>
      </div>
    </motion.div>
  );
}
