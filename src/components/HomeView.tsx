import React, { useState, useEffect } from 'react';
import {
  Volume2,
  RotateCcw,
  Sparkles,
  MessageCircle,
  FileText,
  Pill,
  ShieldAlert,
  Heart,
  Calendar,
  AlertCircle,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { UserProfile, Reminder, MoodCheckIn, DailyBriefing, ActiveTab } from '../types';
import { speakText, stopSpeaking } from '../utils/speech';

interface HomeViewProps {
  profile: UserProfile;
  reminders: Reminder[];
  checkIns: MoodCheckIn[];
  briefing: DailyBriefing | null;
  onUpdateBriefing: (briefing: DailyBriefing) => void;
  onNavigate: (tab: ActiveTab) => void;
  onOpenSOS: () => void;
  onQuickCheckIn: (mood: 'good' | 'okay' | 'not-well') => void;
  onTakeReminder: (id: string) => void;
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  reminders,
  checkIns,
  briefing,
  onUpdateBriefing,
  onNavigate,
  onOpenSOS,
  onQuickCheckIn,
  onTakeReminder,
  isSpeaking,
  setIsSpeaking,
}) => {
  const [loadingBriefing, setLoadingBriefing] = useState<boolean>(false);
  const [briefingError, setBriefingError] = useState<string>('');

  // Determine time of day
  const hour = new Date().getHours();
  const timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' =
    hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find((c) => c.date === todayStr);

  // Active reminders due today
  const activeReminders = reminders.filter((r) => r.status === 'active');
  const dueReminders = reminders.filter((r) => {
    if (r.status !== 'active') return false;
    // Highlight if within current hour or morning
    return true;
  });

  // Fetch or generate briefing
  const fetchBriefing = async () => {
    setLoadingBriefing(true);
    setBriefingError('');
    try {
      const res = await fetch('/api/gemini/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile,
          reminders: activeReminders,
          checkIn: todayCheckIn,
          timeOfDay,
          dateString: new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          }),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onUpdateBriefing(data);
      } else {
        setBriefingError('Could not refresh briefing right now. Showing saved note.');
      }
    } catch {
      setBriefingError('Briefing loaded in offline mode.');
    } finally {
      setLoadingBriefing(false);
    }
  };

  useEffect(() => {
    if (!briefing) {
      fetchBriefing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReadBriefingAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!briefing) return;

    const speechScript = `
${briefing.greeting}.
Here is your update for today.
Medicines due: ${briefing.medicinesDue.join(', ')}.
Gentle suggestion: ${briefing.gentleSuggestion}.
Daily tip: ${briefing.dailyTip}.
Safety tip: ${briefing.safetyTip}.
${briefing.cheerMessage}
`;

    setIsSpeaking(true);
    speakText(
      speechScript,
      profile.language,
      profile.speechSpeed,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 pb-24">
      {/* Top Greeting Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-amber-500/10 via-amber-100/40 to-transparent dark:from-amber-950/30 dark:via-stone-900 border-2 border-amber-200 dark:border-amber-900/50 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300 font-semibold text-sm">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>{formattedDate}</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 dark:text-stone-50 mt-1">
              {briefing?.greeting || `Good ${timeOfDay}, ${profile.name.split(' ')[0] || 'Friend'} ji`}
            </h2>
            <p className="text-base text-stone-700 dark:text-stone-300 mt-0.5">
              {briefing?.cheerMessage || 'Welcome back to your companion. Wishing you a calm, healthy day.'}
            </p>
          </div>

          {/* Quick status pill */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {todayCheckIn ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Checked In Today: {todayCheckIn.mood.toUpperCase()}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300 dark:border-amber-800">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Morning Check-in Ready</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Due Now Alert Banner (if any reminders pending) */}
      {dueReminders.length > 0 && (
        <div
          id="home-due-now-banner"
          className="p-4 sm:p-5 rounded-3xl bg-red-50 dark:bg-red-950/40 border-3 border-red-400 dark:border-red-800 shadow-md animate-in slide-in-from-top-2"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-extrabold text-lg sm:text-xl">
              <AlertCircle className="w-6 h-6 animate-pulse" />
              <span>Due Now / Routine Medicines ({dueReminders.length})</span>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 hover:underline"
            >
              View All Reminders →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dueReminders.slice(0, 2).map((rem) => (
              <div
                key={rem.id}
                className="p-3 rounded-2xl bg-white dark:bg-stone-900 border border-red-200 dark:border-red-900 flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-900 text-red-900 dark:text-red-200">
                    {rem.time || 'Today'}
                  </span>
                  <p className="font-extrabold text-base text-stone-900 dark:text-stone-100 mt-1">
                    {rem.title}
                  </p>
                  {rem.dosage && (
                    <p className="text-xs text-stone-700 dark:text-stone-300">{rem.dosage}</p>
                  )}
                </div>

                <button
                  onClick={() => onTakeReminder(rem.id)}
                  aria-label={`Mark ${rem.title} as taken`}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-xs flex items-center gap-1.5 focus-visible:ring-4 focus-visible:ring-emerald-400"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Taken</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 BIG QUICK ACTION BUTTONS */}
      <section aria-label="Quick Actions">
        <h3 className="text-lg font-bold text-stone-700 dark:text-stone-300 mb-3 px-1">
          What would you like to do?
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Action 1: Ask */}
          <button
            id="home-action-ask-btn"
            onClick={() => onNavigate('ask')}
            className="min-h-[72px] p-4 rounded-3xl bg-white dark:bg-stone-800 border-2 border-amber-300 dark:border-amber-900/60 hover:border-amber-500 hover:shadow-md transition-all text-left flex items-center gap-4 group focus-visible:ring-4 focus-visible:ring-amber-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-400 group-hover:scale-105 transition-transform shrink-0">
              <MessageCircle className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Ask Something
              </h4>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                Use your voice or type any question
              </p>
            </div>
          </button>

          {/* Action 2: Simplify */}
          <button
            id="home-action-simplify-btn"
            onClick={() => onNavigate('simplify')}
            className="min-h-[72px] p-4 rounded-3xl bg-white dark:bg-stone-800 border-2 border-blue-300 dark:border-blue-900/60 hover:border-blue-500 hover:shadow-md transition-all text-left flex items-center gap-4 group focus-visible:ring-4 focus-visible:ring-blue-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-700 dark:text-blue-400 group-hover:scale-105 transition-transform shrink-0">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                Simplify a Document
              </h4>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                Read bills, letters, or prescriptions in plain words
              </p>
            </div>
          </button>

          {/* Action 3: Medicines */}
          <button
            id="home-action-medicines-btn"
            onClick={() => onNavigate('reminders')}
            className="min-h-[72px] p-4 rounded-3xl bg-white dark:bg-stone-800 border-2 border-emerald-300 dark:border-emerald-900/60 hover:border-emerald-500 hover:shadow-md transition-all text-left flex items-center gap-4 group focus-visible:ring-4 focus-visible:ring-emerald-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
              <Pill className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-stone-900 dark:text-stone-100">
                My Medicines & Tasks
              </h4>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                {activeReminders.length} active reminders scheduled
              </p>
            </div>
          </button>

          {/* Action 4: SOS Help */}
          <button
            id="home-action-sos-btn"
            onClick={onOpenSOS}
            className="min-h-[72px] p-4 rounded-3xl bg-white dark:bg-stone-800 border-2 border-red-400 dark:border-red-900/80 hover:border-red-600 hover:shadow-md transition-all text-left flex items-center gap-4 group focus-visible:ring-4 focus-visible:ring-red-500"
          >
            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-700 dark:text-red-400 group-hover:scale-105 transition-transform shrink-0">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-red-700 dark:text-red-400">
                I Need Help (SOS)
              </h4>
              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300">
                Call family or emergency with one tap
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* PROACTIVE "TODAY FOR YOU" AI CARD */}
      <section
        id="home-today-briefing-card"
        aria-label="Today For You Daily Briefing"
        className="p-6 rounded-3xl bg-white dark:bg-stone-800 border-2 border-stone-300 dark:border-stone-700 shadow-md space-y-4"
      >
        <div className="flex items-center justify-between border-b pb-3 border-stone-200 dark:border-stone-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100">
                Today for You
              </h3>
              <p className="text-xs text-stone-700 dark:text-stone-300">
                Proactive daily care prepared by Sathi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReadBriefingAloud}
              aria-label={isSpeaking ? 'Stop reading' : 'Read today’s briefing aloud'}
              className="min-h-[46px] px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Volume2 className="w-4 h-4" />
              <span>{isSpeaking ? 'Stop' : 'Read Aloud'}</span>
            </button>

            <button
              onClick={fetchBriefing}
              disabled={loadingBriefing}
              aria-label="Refresh daily briefing"
              className="min-h-[46px] min-w-[46px] p-2.5 rounded-xl border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center justify-center"
            >
              <RotateCcw className={`w-4 h-4 ${loadingBriefing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {briefingError && (
          <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
            {briefingError}
          </p>
        )}

        {loadingBriefing ? (
          <div className="py-8 text-center space-y-2">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
              Preparing your daily health & safety briefing...
            </p>
          </div>
        ) : briefing ? (
          <div className="space-y-4 text-stone-800 dark:text-stone-200">
            {/* Medicines Due Section */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-stone-900/60 border border-amber-200 dark:border-amber-900/40">
              <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <Pill className="w-4 h-4" />
                <span>Medicines Due Today</span>
              </h4>
              <ul className="list-disc list-inside text-base sm:text-lg space-y-1 font-medium">
                {briefing.medicinesDue?.map((med, i) => (
                  <li key={i}>{med}</li>
                ))}
              </ul>
            </div>

            {/* Gentle Suggestion */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-stone-900/60 border border-emerald-200 dark:border-emerald-900/40">
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Heart className="w-4 h-4" />
                <span>Gentle Movement & Hydration</span>
              </h4>
              <p className="text-base sm:text-lg font-medium leading-relaxed">
                {briefing.gentleSuggestion}
              </p>
            </div>

            {/* Simple Daily Tip */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-stone-900/60 border border-blue-200 dark:border-blue-900/40">
              <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Daily Comfort Tip</span>
              </h4>
              <p className="text-base sm:text-lg font-medium leading-relaxed">
                {briefing.dailyTip}
              </p>
            </div>

            {/* Safety Tip */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-stone-900/60 border border-rose-200 dark:border-rose-900/40">
              <h4 className="text-sm font-bold text-rose-900 dark:text-rose-300 uppercase tracking-wide flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-4 h-4" />
                <span>Safety & Fraud Alert of the Day</span>
              </h4>
              <p className="text-base sm:text-lg font-medium leading-relaxed text-rose-950 dark:text-rose-200">
                {briefing.safetyTip}
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {/* Quick Mood Check-in (if not done today) */}
      {!todayCheckIn && (
        <section
          aria-label="Quick Wellbeing Check"
          className="p-5 rounded-3xl bg-amber-50 dark:bg-stone-800/90 border-2 border-amber-300 dark:border-amber-800 shadow-sm space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold">How are you feeling right now?</h3>
            </div>
            <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
              Takes 5 seconds
            </span>
          </div>
          <p className="text-sm text-stone-700 dark:text-stone-300">
            Tap an emoji to record your morning wellbeing. Sathi adapts your day based on this.
          </p>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onQuickCheckIn('good')}
              aria-label="Feeling Good"
              className="min-h-[58px] p-3 rounded-2xl bg-white dark:bg-stone-900 border-2 border-emerald-400 hover:border-emerald-600 text-emerald-900 dark:text-emerald-200 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-xs"
            >
              <Smile className="w-6 h-6 text-emerald-600" />
              <span>Good</span>
            </button>

            <button
              onClick={() => onQuickCheckIn('okay')}
              aria-label="Feeling Okay"
              className="min-h-[58px] p-3 rounded-2xl bg-white dark:bg-stone-900 border-2 border-amber-400 hover:border-amber-600 text-amber-900 dark:text-amber-200 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-xs"
            >
              <Meh className="w-6 h-6 text-amber-600" />
              <span>Okay</span>
            </button>

            <button
              onClick={() => onQuickCheckIn('not-well')}
              aria-label="Not feeling well"
              className="min-h-[58px] p-3 rounded-2xl bg-white dark:bg-stone-900 border-2 border-red-400 hover:border-red-600 text-red-900 dark:text-red-200 font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-xs"
            >
              <Frown className="w-6 h-6 text-red-600" />
              <span>Not Well</span>
            </button>
          </div>
        </section>
      )}

      {/* Footer Trust & Privacy Note */}
      <footer className="pt-4 pb-8 border-t border-stone-200 dark:border-stone-800 text-center space-y-1 text-xs sm:text-sm text-stone-700 dark:text-stone-300">
        <p className="font-semibold">
          Sathi gives general guidance, not professional medical, legal, or financial advice.
        </p>
        <p>
          Privacy Note: All your notes and medical reminders stay stored securely on this device.
        </p>
      </footer>
    </div>
  );
};
