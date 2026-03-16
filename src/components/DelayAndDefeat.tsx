import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import hourglassImg from "@/assets/hourglass.png";
import { useTranslation } from "react-i18next";
import { pool } from "@/lib/db";

interface HistoryEntry {
  id: string;
  date: string;
  delayTime: number;
  urgeBefore: number;
  urgeAfter: number;
}

const DELAY_OPTIONS = [
  { labelKey: "delay_30s", value: 30 },
  { labelKey: "delay_1m", value: 60 },
  { labelKey: "delay_2m", value: 120 },
  { labelKey: "delay_3m", value: 180 },
];

const pageVariants = {
  initial: { opacity: 0, x: 60 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { opacity: 0, x: -60, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
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

function formatDelay(seconds: number, t: any): string {
  if (seconds < 60) return t("format_seconds", { count: seconds });
  return t(seconds > 60 ? "format_minutes" : "format_minute", { count: seconds / 60 });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DelayAndDefeat() {
  const { t } = useTranslation();
  const [screen, setScreen] = useState(0);
  const [delayTime, setDelayTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(0);
  const [urgeBefore, setUrgeBefore] = useState(5);
  const [urgeAfter, setUrgeAfter] = useState(5);
  const [selectedDelay, setSelectedDelay] = useState<number | null>(null);

  const goNext = useCallback(() => setScreen((s) => s + 1), []);

  useEffect(() => {
    if (screen !== 3) return;
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

  const handleCompleteFlow = async () => {
    saveHistory({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      delayTime,
      urgeBefore,
      urgeAfter,
    });
    setScreen(5);

    try {
      const userId = sessionStorage.getItem("user_id");
      if (userId) {
        await pool.query(
          "INSERT INTO delay_sessions (user_id, delay_time, urge_before, urge_after) VALUES ($1, $2, $3, $4)",
          [userId, delayTime, urgeBefore, urgeAfter]
        );
      }
    } catch (e) {
      console.error("Neon DB Save failed:", e);
    }
  };

  const restart = () => {
    setSelectedDelay(null);
    setUrgeBefore(5);
    setUrgeAfter(5);
    setScreen(0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-[400px] min-h-[85vh] bg-card rounded-3xl shadow-xl overflow-hidden relative flex flex-col">
        <AnimatePresence mode="wait">
          {screen === 0 && (
            <IntroScreen key="intro" onNext={goNext} />
          )}
          {screen === 1 && (
            <RateUrgeBeforeScreen
              key="urgeBefore"
              value={urgeBefore}
              onChange={setUrgeBefore}
              onNext={goNext}
            />
          )}
          {screen === 2 && (
            <SetDelayScreen
              key="delay"
              selected={selectedDelay}
              onSelect={(v) => { setSelectedDelay(v); setDelayTime(v); }}
              onStart={startTimer}
            />
          )}
          {screen === 3 && (
            <TimerScreen
              key="timer"
              timeLeft={timeLeft}
              total={delayTime}
              onSkip={goNext}
            />
          )}
          {screen === 4 && (
            <CheckUrgeScreen
              key="check"
              value={urgeAfter}
              onChange={setUrgeAfter}
              onNext={handleCompleteFlow}
            />
          )}
          {screen === 5 && (
            <VictoryScreen
              key="victory"
              delayTime={delayTime}
              urgeBefore={urgeBefore}
              urgeAfter={urgeAfter}
              onRetry={restart}
              onViewHistory={() => setScreen(6)}
            />
          )}
          {screen === 6 && (
            <HistoryScreen
              key="history"
              onBack={() => setScreen(5)}
              onNewDelay={restart}
              formatDelay={(sec) => formatDelay(sec, t)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function IntroScreen({ onNext }: { onNext: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1 px-5 py-8">
      <button className="flex items-center gap-1 text-primary text-sm mb-6 self-start">
        <ArrowLeft size={16} /> {t("back")}
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6 text-justify">
        {t("delay_and_defeat")}
      </h1>

      <div className="flex justify-center mb-6">
        <img src={hourglassImg} alt={t("hourglass_alt")} className="w-32 h-32 object-contain" />
      </div>

      <div className="flex-1 space-y-4 text-base text-foreground text-justified leading-relaxed">
        <p>{t("intro_p1")}</p>
        <p>{t("intro_p2")}</p>
        <p>{t("intro_p3")}</p>
        <p>{t("intro_p4")}</p>
      </div>

      <div className="mt-8">
        <Button onClick={onNext} className="w-full" size="lg">
          {t("start_delay")}
        </Button>
      </div>
    </motion.div>
  );
}

function SetDelayScreen({ selected, onSelect, onStart }: { selected: number | null; onSelect: (v: number) => void; onStart: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1 px-5 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-4 text-justify">
        {t("how_long_wait")}
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed mb-8">
        <p>{t("choose_short_delay")}</p>
        <p>{t("observe_craving")}</p>
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
            {t(opt.labelKey)}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <Button onClick={onStart} className="w-full" size="lg" disabled={!selected}>
          {t("start_timer")}
        </Button>
      </div>
    </motion.div>
  );
}

function RateUrgeBeforeScreen({ value, onChange, onNext }: { value: number; onChange: (v: number) => void; onNext: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1 px-5 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-4 text-justify">
        {t("how_strong_now")}
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed mb-10">
        <p>{t("timer_instructions_p1")}</p>
        <p>{t("timer_instructions_p2")}</p>
      </div>

      <div className="flex justify-center gap-2 my-8">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={`w-6 h-6 rounded-full transition-all duration-300 ${i < value ? "bg-primary shadow-md scale-110" : "bg-accent"}`}
          />
        ))}
      </div>

      <div className="mt-auto">
        <Button onClick={onNext} className="w-full" size="lg">
          {t("next")}
        </Button>
      </div>
    </motion.div>
  );
}

function TimerScreen({ timeLeft, total, onSkip }: { timeLeft: number; total: number; onSkip: () => void }) {
  const { t } = useTranslation();
  const progress = total > 0 ? (total - timeLeft) / total : 0;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1 px-5 py-8 items-center">
      <h1 className="text-2xl font-bold text-foreground mb-4 text-justify w-full">
        {t("stay_moment")}
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed w-full mb-8">
        <p>{t("observe_body")}</p>
        <p>{t("urges_rise_fall")}</p>
        <p>{t("observe_no_reaction")}</p>
      </div>

      <div className="relative flex items-center justify-center my-6">
        <div className="absolute w-48 h-48 rounded-full bg-primary/15 animate-pulse-ring" />
        <div className="absolute w-56 h-56 rounded-full bg-primary/8 animate-pulse-ring" style={{ animationDelay: "0.5s" }} />

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

      <p className="text-muted-foreground text-sm mt-4 italic">{t("just_breathe")}</p>

      <div className="mt-auto w-full">
        <Button onClick={onSkip} variant="secondary" className="w-full" size="lg">
          {t("skip_timer")}
        </Button>
      </div>
    </motion.div>
  );
}

function CheckUrgeScreen({ value, onChange, onNext }: { value: number; onChange: (v: number) => void; onNext: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1 px-5 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-4 text-justify">
        {t("how_strong_after")}
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed mb-10">
        <p>{t("check_p1")}</p>
        <p>{t("check_p2")}</p>
      </div>

      <div className="flex justify-center gap-2 my-8">
        {Array.from({ length: 10 }, (_, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            className={`w-6 h-6 rounded-full transition-all duration-300 ${i < value ? "bg-primary shadow-md scale-110" : "bg-accent"}`}
          />
        ))}
      </div>

      <div className="mt-auto">
        <Button onClick={onNext} className="w-full" size="lg">
          {t("next")}
        </Button>
      </div>
    </motion.div>
  );
}

function VictoryScreen({ delayTime, urgeBefore, urgeAfter, onRetry, onViewHistory }: { delayTime: number; urgeBefore: number; urgeAfter: number; onRetry: () => void; onViewHistory: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1 px-5 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-2 text-justify">
        {t("victory_title")}
      </h1>

      <div className="space-y-3 text-base text-foreground text-justified leading-relaxed mb-6">
        <p>{t("victory_p1")}</p>
        <p>{t("victory_p2")}</p>
        <p>{t("victory_p3")}</p>
      </div>

      <div className="bg-card rounded-2xl shadow-md p-5 space-y-4 mb-6 border border-border">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">{t("delay_time")}</span>
          <span className="text-sm font-bold text-foreground">{formatDelay(delayTime, t)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">{t("urge_before")}</span>
          <div className="flex gap-1">
            {Array.from({ length: urgeBefore }, (_, i) => <div key={i} className="w-3 h-3 rounded-full bg-primary" />)}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-muted-foreground">{t("urge_after")}</span>
          <div className="flex gap-1">
            {Array.from({ length: urgeAfter }, (_, i) => <div key={i} className="w-3 h-3 rounded-full bg-secondary" />)}
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3">
        <Button onClick={onRetry} className="w-full" size="lg">
          {t("try_another_delay")}
        </Button>
        <Button onClick={onViewHistory} variant="secondary" className="w-full" size="lg">
          {t("view_history")}
        </Button>
      </div>
    </motion.div>
  );
}

function HistoryScreen({ onBack, onNewDelay, formatDelay }: { onBack: () => void; onNewDelay: () => void; formatDelay: (seconds: number) => string }) {
  const { t } = useTranslation();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDBHistory() {
      const userId = sessionStorage.getItem("user_id");
      if (!userId) {
        setHistory(getHistory());
        setLoading(false);
        return;
      }
      try {
        const res = await pool.query(
          "SELECT id, delay_time, urge_before, urge_after, created_at FROM delay_sessions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
          [userId]
        );
        setHistory(
          res.rows.map((r: any) => ({
            id: r.id.toString(),
            date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            delayTime: r.delay_time,
            urgeBefore: r.urge_before,
            urgeAfter: r.urge_after,
          }))
        );
      } catch (e) {
        console.error("DB History fetch failed", e);
        setHistory(getHistory());
      }
      setLoading(false);
    }
    fetchDBHistory();
  }, []);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col flex-1 px-5 py-8">
      <button onClick={onBack} className="flex items-center gap-1 text-primary text-sm mb-6 self-start">
        <ArrowLeft size={16} /> {t("back")}
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-6 text-justify">
        {t("your_history")}
      </h1>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center text-sm animate-pulse">Loading...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center">{t("no_entries")}</p>
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
                  <span className="text-xs text-muted-foreground">{t("before_label")}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: entry.urgeBefore }, (_, i) => <div key={i} className="w-2 h-2 rounded-full bg-primary" />)}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">{t("after_label")}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: entry.urgeAfter }, (_, i) => <div key={i} className="w-2 h-2 rounded-full bg-secondary" />)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={onNewDelay} className="w-full" size="lg">
          {t("start_new_delay")}
        </Button>
      </div>
    </motion.div>
  );
}
